import { TRedisBase } from './TRedisType';
import {
  TRedisCurrentRoomJoinToTargetRoomEvent,
  TRedisEvent,
  TRedisKickTargetRoomFromCurrentRoomEvent,
  TRedisSendToRoomEvent,
} from './Types/TRedisEvent';
import { ERedisSubEvents } from './RedisSub/ERedisSubEvents';

abstract class RedisBase {
  protected constructor(readonly redis: TRedisBase) {}

  isCurrentRoomJoinToTargetRoomEvent(
    payload: TRedisEvent,
  ): payload is TRedisCurrentRoomJoinToTargetRoomEvent {
    return payload.event === ERedisSubEvents.currentRoomJoinToTargetRoom;
  }

  isLeaveTargetRoomFromCurrentRoomEvent(
    payload: TRedisEvent,
  ): payload is TRedisKickTargetRoomFromCurrentRoomEvent {
    return payload.event === ERedisSubEvents.kickTargetRoomFromCurrentRoom;
  }

  isSendToRoomEvent(payload: TRedisEvent): payload is TRedisSendToRoomEvent {
    return payload.event === ERedisSubEvents.sendToRoom;
  }

  protected generatePubSubKey(userId: string, event: string) {
    return `${userId}.${event}`;
  }
}

export { RedisBase };
