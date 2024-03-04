import { ERedisSubEvents } from '../RedisSub/ERedisSubEvents';

type TRedisSendEvent = {
  id?: string;
  event: ERedisSubEvents.sendToRoom;
  payload: any;
};

type TRedisCurrentRoomJoinToTargetRoomEvent = {
  id?: string;
  event: ERedisSubEvents.currentRoomJoinToTargetRoom;
  payload: { roomName: string };
};

type TRedisLeaveTargetRoomFromCurrentRoomEvent = {
  id?: string;
  event: ERedisSubEvents.leaveTargetRoomFromCurrentRoom;
  payload: { roomName: string };
};

type TRedisEvent =
  | TRedisSendEvent
  | TRedisCurrentRoomJoinToTargetRoomEvent
  | TRedisLeaveTargetRoomFromCurrentRoomEvent;

export type {
  TRedisEvent,
  TRedisSendEvent,
  TRedisCurrentRoomJoinToTargetRoomEvent,
  TRedisLeaveTargetRoomFromCurrentRoomEvent,
};
