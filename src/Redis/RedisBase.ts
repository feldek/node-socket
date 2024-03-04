import { TRedisBase } from './TRedisType';
import {
  TRedisCurrentRoomJoinToTargetRoomEvent,
  TRedisEvent,
  TRedisLeaveTargetRoomFromCurrentRoomEvent,
  TRedisSendEvent,
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
  ): payload is TRedisLeaveTargetRoomFromCurrentRoomEvent {
    return payload.event === ERedisSubEvents.leaveTargetRoomFromCurrentRoom;
  }

  isSendToRoomEvent(payload: TRedisEvent): payload is TRedisSendEvent {
    return payload.event === ERedisSubEvents.sendToRoom;
  }

  protected generatePubSubKey(userId: string, event: string) {
    return `${userId}.${event}`;
  }
}

export { RedisBase };
