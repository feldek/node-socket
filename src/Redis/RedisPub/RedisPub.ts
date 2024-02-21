import { getRedisConfig } from '../RedisConfig';
import { createRedisClient } from '../RedisClient';
import { IGetRedisInstance } from '../TRedisType';
import { RedisBase } from '../RedisBase';
import { ERoomName } from '../../Constant/Enum/ERoomName';

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
 emit<T extends ERoomName>(targetId: string, roomName: T, socketSessionId: string, payload: any) {
  return this.redis.publish(
   this.generatePubSubKeyCurrentSession(targetId, roomName, socketSessionId),
   JSON.stringify(payload),
  );
 }
}

const redisPub = new RedisPub();

export { redisPub, redisPubClient };
