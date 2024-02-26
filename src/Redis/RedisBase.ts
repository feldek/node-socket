import { TRedisBase } from './TRedisType';
import { TRedisEvent, TRedisJoinToRoomEvent, TRedisSendEvent } from './Types/TRedisEvent';
import { ERedisSubEvents } from './RedisSub/ERedisSubEvents';

abstract class RedisBase {
 protected constructor(readonly redis: TRedisBase) {}

 isJoinToRoomEvent(payload: TRedisEvent): payload is TRedisJoinToRoomEvent {
  return payload.event === ERedisSubEvents.subscribeToRoom;
 }

 isSendToRoomEvent(payload: TRedisEvent): payload is TRedisSendEvent {
  return payload.event === ERedisSubEvents.sendToRoom;
 }

 protected generatePubSubKey(userId: string, event: string) {
  return `${userId}.${event}`;
 }
}

export { RedisBase };
