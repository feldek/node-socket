import { TRedisBase } from './TRedisType';
import {
  TRedisCurrentRoomJoinToTargetRoomEvent as TRedisJoinRoomEvent,
  TRedisEvent,
  TRedisKickTargetRoomFromCurrentRoomEvent as TRedisLeaveRoomEvent,
  TRedisSendToRoomEvent,
} from './Types/TRedisEvent';
import { ERedisSubEvents } from './RedisSub/ERedisSubEvents';

abstract class RedisBase {
  protected constructor(readonly redis: TRedisBase) {}

  isJoinRoomEvent(payload: TRedisEvent): payload is TRedisJoinRoomEvent {
    return payload.event === ERedisSubEvents.joinRoom;
  }

  isLeaveRoomEvent(payload: TRedisEvent): payload is TRedisLeaveRoomEvent {
    return payload.event === ERedisSubEvents.leaveRoom;
  }

  isSendToRoomEvent(payload: TRedisEvent): payload is TRedisSendToRoomEvent {
    return payload.event === ERedisSubEvents.sendToRoom;
  }

  protected generatePubSubKey(userId: string, event: string) {
    return `${userId}.${event}`;
  }
}

export { RedisBase };
