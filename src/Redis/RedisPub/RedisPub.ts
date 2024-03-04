import { getRedisConfig } from '../RedisConfig';
import { createRedisClient } from '../RedisClient';
import { IGetRedisInstance } from '../TRedisType';
import { RedisBase } from '../RedisBase';
import { ERoomName } from '../../Constant/Enum/ERoomName';
import { TRedisEvent } from '../Types/TRedisEvent';

const redisPubClient = createRedisClient(getRedisConfig('redisPub'));

class RedisPub extends RedisBase implements IGetRedisInstance {
  constructor() {
    super(redisPubClient);
  }

  getInstance() {
    return this.redis;
  }

  /**
   *
   * @param targetId - userId or clientId, it depends on room
   * @param roomName
   * @param payload
   */
  emit(roomName: string, payload: TRedisEvent) {
    return this.redis.publish(roomName, JSON.stringify(payload));
  }
  // emit<T extends ERoomName>(targetId: string, roomName: T, payload: TRedisEvent) {
  //   return this.redis.publish(this.generatePubSubKey(targetId, roomName), JSON.stringify(payload));
  // }

  async isActiveChannel(roomName: string): Promise<boolean> {
    const activeChannels = await this.redis.pubSubChannels(roomName);

    return activeChannels.length !== 0;
  }
}

const redisPub = new RedisPub();

export { redisPub, redisPubClient };
