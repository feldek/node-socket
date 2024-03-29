import { createRedisClient } from '../RedisClient';
import { getRedisConfig } from '../RedisConfig';
import { RedisBase } from '../RedisBase';
import { IGetRedisInstance } from '../TRedisType';
import { TRedisEvent } from '../Types/TRedisEvent';
import { TWsServer } from '../../WsServer/Type/WsServer';
import { redisPub } from '../RedisPub/RedisPub';

const redisSubClient = createRedisClient(getRedisConfig('redisSub'));

type TRedisEventHandler = (payload: any) => void;

type TListener = { socketId: string; channelListener: TRedisEventHandler };

class RedisSub extends RedisBase implements IGetRedisInstance {
  /**
   * @key - roomName
   */
  listeners: { [key: string]: TListener[] } = {};

  constructor() {
    super(redisSubClient);
  }

  getInstance() {
    return this.redis;
  }

  async joinSocket(ws: TWsServer, roomName: string, socketId: string) {
    const roomListeners = this.listeners[roomName] || [];

    // callback for redis sub channel
    const channelListener = this.generateChannelListener(ws, roomName);

    this.listeners[roomName] = [...roomListeners, { socketId, channelListener }];

    await this.subscribeChannel(roomName);
  }

  async leaveSocket(roomName: string, socketId: string) {
    const roomListeners = this.getListeners(roomName);

    const updatedListeners = roomListeners.filter((it) => socketId !== it.socketId);

    await this.setListeners(roomName, updatedListeners);
  }

  deleteListeners(socketId: string) {
    for (const roomName in this.listeners) {
      this.leaveSocket(roomName, socketId);
    }
  }

  private getListeners(roomName: string): TListener[] {
    return this.listeners[roomName] || [];
  }

  private async setListeners(roomName: string, listeners: TListener[]) {
    this.listeners[roomName] = listeners;

    //unsubscribe from channel, if this channel doesn't have listeners
    if (listeners.length === 0) {
      await this.unsubscribe(roomName);
    }
  }

  private generateChannelListener(ws: TWsServer, currentRoomName: string): TRedisEventHandler {
    return async (message: string) => {
      try {
        const payload = JSON.parse(message) as TRedisEvent;

        if (this.isJoinRoomEvent(payload)) {
          const targetRoomName = payload.payload.roomName;

          const currentRoomListeners = this.getListeners(targetRoomName);

          const targetRoomListeners = this.getListeners(currentRoomName);

          await this.setListeners(targetRoomName, [
            ...currentRoomListeners,
            ...targetRoomListeners,
          ]);

          if (this.listeners[targetRoomName].length === 0) {
            return;
          }

          await this.subscribeChannel(targetRoomName);

          return;
        }

        // all sockets that belong targetRoom should be deleted from current room
        if (this.isLeaveRoomEvent(payload)) {
          const targetRoomName = payload.payload.roomName;

          const currentListeners = this.getListeners(currentRoomName);

          const socketIdsFromTargetRoom = currentListeners.map(({ socketId }) => socketId);

          const targetListeners = this.getListeners(targetRoomName);

          // delete target sockets
          const updatedCurrentListeners = targetListeners.filter(
            ({ socketId }) => !socketIdsFromTargetRoom.includes(socketId),
          );

          await this.setListeners(targetRoomName, updatedCurrentListeners);

          return;
        }

        if (this.isSendToRoomEvent(payload)) {
          ws.send(message);
          return;
        }
      } catch (err) {
        console.error(err);
      }
    };
  }

  private async subscribeChannel(roomName: string) {
    // check - if this connection has already had subscribe
    const isActiveChannel = await redisPub.isActiveChannel(roomName);

    if (isActiveChannel) {
      return;
    }

    const listeners = this.listeners[roomName];

    if (listeners === undefined) {
      throw Error(`Before subscribe to channel need to set listeners for roomName: ${roomName}`);
    }

    await this.redis.subscribe(roomName, (message) => {
      listeners.forEach((it) => it.channelListener(message));
    });
  }

  private unsubscribe(roomName: string) {
    return this.redis.unsubscribe(roomName);
  }
}

const redisSub = new RedisSub();

export { redisSub, redisSubClient };
