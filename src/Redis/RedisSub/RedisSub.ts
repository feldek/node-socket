import { createRedisClient } from '../RedisClient';
import { getRedisConfig } from '../RedisConfig';
import { RedisBase } from '../RedisBase';
import { IGetRedisInstance } from '../TRedisType';
import { ESocketHandleEvent } from '../../Constant/Enum/ESocketHandleEvent';
import { ESocketEmitEvent } from '../../Constant/Enum/ESocketEmitEvent';
import { ERoomName } from '../../Constant/Enum/ERoomName';

const redisSubClient = createRedisClient(getRedisConfig('redisSub'));

class RedisSub extends RedisBase implements IGetRedisInstance {
 constructor() {
  super(redisSubClient);
 }

 getInstance() {
  return this.redis;
 }

 async listen(targetId: string, event: ERoomName) {
  this.redis.pSubscribe(this.generatePubSubKeyForAllSessions(targetId, event), async (data) => {
   // this.redis.subscribe(this.generatePubSubKeyCurrentSession(targetId, event, 'test'), async (data) => {
   try {
    const parsedData = JSON.parse(data);

    console.log('redis sub event:', targetId, parsedData);
   } catch (err) {
    console.error(`During handle ${event} in queue`, err);
   }
  });
 }

 async unsubCurrent(targetId: string, event: ERoomName, socketSessionId: string) {
  this.redis.unsubscribe(this.generatePubSubKeyCurrentSession(targetId, event, socketSessionId));
 }

 async unsubAll(targetId: string, event: ERoomName) {
  // this.redis.unsubscribe(`${this.generatePubSubKey(targetId, event)}.*`);
  this.redis.pUnsubscribe(`${targetId}.*`);
 }
}

const redisSub = new RedisSub();

export { redisSub, redisSubClient };
