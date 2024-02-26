import { createRedisClient } from '../RedisClient';
import { getRedisConfig } from '../RedisConfig';
import { RedisBase } from '../RedisBase';
import { IGetRedisInstance } from '../TRedisType';
import { TRedisEvent } from '../Types/TRedisEvent';

const redisSubClient = createRedisClient(getRedisConfig('redisSub'));

class RedisSub extends RedisBase implements IGetRedisInstance {
 constructor() {
  super(redisSubClient);
 }

 getInstance() {
  return this.redis;
 }

 async listen(targetId: string, event: string) {
  this.listenBase(this.generatePubSubKey(targetId, event));
 }

 async listenBase(roomName: string) {
  this.redis.subscribe(roomName, async (data) => {
   try {
    const payload = JSON.parse(data) as TRedisEvent;

    console.log('redis sub event:', roomName, payload);

    if (this.isJoinToRoomEvent(payload)) {
     return;
    }

    if (this.isSendToRoomEvent(payload)) {
     return;
    }

    console.error('Wrong redis event:', roomName, payload);
   } catch (err) {
    console.error(`During handle ${event} in queue`, err);
   }
  });
 }

 // async unsubCurrent(targetId: string, event: ERoomName, socketSessionId: string) {
 //  this.redis.unsubscribe(this.generatePubSubKeyCurrentSession(targetId, event, socketSessionId));
 // }
 //
 // async unsubAll(targetId: string, event: ERoomName) {
 //  // this.redis.unsubscribe(`${this.generatePubSubKey(targetId, event)}.*`);
 //  this.redis.pUnsubscribe(`${targetId}.*`);
 // }
}

const redisSub = new RedisSub();

export { redisSub, redisSubClient };
