import { ERedisSubEvents } from '../RedisSub/ERedisSubEvents';

type TRedisSendToRoomEvent = {
  id?: string;
  event: ERedisSubEvents.sendToRoom;
  payload: any;
};

type TRedisCurrentRoomJoinToTargetRoomEvent = {
  id?: string;
  event: ERedisSubEvents.currentRoomJoinToTargetRoom;
  payload: { roomName: string };
};

type TRedisKickTargetRoomFromCurrentRoomEvent = {
  id?: string;
  event: ERedisSubEvents.kickTargetRoomFromCurrentRoom;
  payload: { roomName: string };
};

type TRedisEvent =
  | TRedisSendToRoomEvent
  | TRedisCurrentRoomJoinToTargetRoomEvent
  | TRedisKickTargetRoomFromCurrentRoomEvent;

export type {
  TRedisEvent,
  TRedisSendToRoomEvent,
  TRedisCurrentRoomJoinToTargetRoomEvent,
  TRedisKickTargetRoomFromCurrentRoomEvent,
};
