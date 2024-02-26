import { ERedisSubEvents } from '../RedisSub/ERedisSubEvents';

type TRedisSendEvent = {
 id?: string;
 event: ERedisSubEvents.sendToRoom;
 payload: any;
};

type TRedisJoinToRoomEvent = {
 id?: string;
 event: ERedisSubEvents.subscribeToRoom;
 payload: { roomName: string };
};

type TRedisEvent = TRedisSendEvent | TRedisJoinToRoomEvent;

export type { TRedisEvent, TRedisSendEvent, TRedisJoinToRoomEvent };
