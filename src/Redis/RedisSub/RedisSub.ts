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
  // listeners: Record<string, TListener[]> = {};
  listeners: { [key: string]: TListener[] } = {};

  constructor() {
    super(redisSubClient);
  }

  getInstance() {
    return this.redis;
  }

  async joinToRoom(ws: TWsServer, roomName: string) {
    const roomListeners = this.listeners[roomName] || [];

    const socketId = ws.getUserData().socketId;

    // callback for redis sub channel
    const channelListener = this.generateChannelListener(ws, roomName);

    this.listeners[roomName] = [...roomListeners, { socketId, channelListener }];

    await this.subscribeChannel(roomName);
  }

  async leaveFromRoom(roomName: string, socketId: string) {
    const roomListeners = this.getListeners(roomName);

    const updatedListeners = roomListeners.filter((it) => socketId !== it.socketId);

    await this.setListeners(roomName, updatedListeners);
  }

  getListeners(roomName: string): TListener[] {
    return this.listeners[roomName] || [];
  }

  async setListeners(roomName: string, listeners: TListener[]) {
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

        if (this.isCurrentRoomJoinToTargetRoomEvent(payload)) {
          // all sockets from currentRoomName we should join to targetRoomName
          const targetRoomName = payload.payload.roomName;

          /**
           * 1) take listeners, that need join to targetRoomName
           * 2) add it to listeners targetRoomName
           */
          const listenersAlreadyJoinedInTargetRoom = this.listeners[targetRoomName] || [];

          const listenersNeedJoinToTargetRoom = this.listeners[currentRoomName] || [];

          this.listeners[targetRoomName] = [
            ...listenersAlreadyJoinedInTargetRoom,
            ...listenersNeedJoinToTargetRoom,
          ];

          await this.subscribeChannel(targetRoomName);

          return;
        }

        // all sockets that belong targetRoom should be deleted from current room
        if (this.isLeaveTargetRoomFromCurrentRoomEvent(payload)) {
          const targetRoomName = payload.payload.roomName;

          const targetListeners = this.getListeners(targetRoomName);

          const socketIdsFromTargetRoom = targetListeners.map(({ socketId }) => socketId);

          const currentListeners = this.getListeners(currentRoomName);

          // delete target sockets
          const updatedCurrentListeners = currentListeners.filter(
            ({ socketId }) => !socketIdsFromTargetRoom.includes(socketId),
          );

          await this.setListeners(currentRoomName, updatedCurrentListeners);

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
