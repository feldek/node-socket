import { TRedisBase } from './TRedisType';
import {
  TRedisCurrentRoomJoinToTargetRoomEvent as TRedisTargetRoomJoinToCurrentRoomEvent,
  TRedisEvent,
  TRedisKickTargetRoomFromCurrentRoomEvent as TRedisLeaveTargetRoomFromCurrentRoomEvent,
  TRedisSendToRoomEvent,
} from './Types/TRedisEvent';
import { ERedisSubEvents } from './RedisSub/ERedisSubEvents';

abstract class RedisBase {
  protected constructor(readonly redis: TRedisBase) {}

  isTargetRoomJoinToCurrentRoomEvent(
    payload: TRedisEvent,
  ): payload is TRedisTargetRoomJoinToCurrentRoomEvent {
    return payload.event === ERedisSubEvents.targetRoomJoinToCurrentRoom;
  }

  isLeaveTargetRoomFromCurrentRoomEvent(
    payload: TRedisEvent,
  ): payload is TRedisLeaveTargetRoomFromCurrentRoomEvent {
    return payload.event === ERedisSubEvents.leaveTargetRoomFromCurrentRoom;
  }

  isSendToRoomEvent(payload: TRedisEvent): payload is TRedisSendToRoomEvent {
    return payload.event === ERedisSubEvents.sendToRoom;
  }

  protected generatePubSubKey(userId: string, event: string) {
    return `${userId}.${event}`;
  }
}

export { RedisBase };
