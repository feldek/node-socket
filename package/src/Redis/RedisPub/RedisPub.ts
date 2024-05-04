import { getRedisConfig } from '../RedisConfig';
import { createRedisClient } from '../RedisClient';
import { IGetRedisInstance } from '../TRedisType';
import { RedisBase } from '../RedisBase';
import {
  TRedisCurrentRoomJoinToTargetRoomEvent,
  TRedisEvent,
  TRedisKickTargetRoomFromCurrentRoomEvent,
  TRedisSendToRoomEvent,
} from '../Types/TRedisEvent';

const redisPubClient = createRedisClient(getRedisConfig('redisPub'));

class RedisPub extends RedisBase implements IGetRedisInstance {
  constructor() {
    super(redisPubClient);
  }

  getInstance() {
    return this.redis;
  }

  /**
   * @param roomName
   * @param payload
   */
  emit(roomName: string, payload: TRedisEvent) {
    return this.redis.publish(roomName, JSON.stringify(payload));
  }

  joinRoom(roomName: string, payload: TRedisCurrentRoomJoinToTargetRoomEvent) {
    return this.emit(roomName, payload);
  }

  sendToRoom(roomName: string, payload: TRedisSendToRoomEvent) {
    return this.emit(roomName, payload);
  }

  leaveRoom(roomName: string, payload: TRedisKickTargetRoomFromCurrentRoomEvent) {
    return this.emit(roomName, payload);
  }

  async isActiveChannel(roomName: string): Promise<boolean> {
    const activeChannels = await this.redis.pubSubChannels(roomName);

    return activeChannels.length !== 0;
  }
}

const redisPub = new RedisPub();

export { redisPub, redisPubClient };
