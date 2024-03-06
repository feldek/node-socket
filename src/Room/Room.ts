import { redisPub } from '../Redis/RedisPub/RedisPub';
import { redisSub } from '../Redis/RedisSub/RedisSub';
import { TWsServer } from '../WsServer/Type/WsServer';
import {
  TRedisCurrentRoomJoinToTargetRoomEvent,
  TRedisKickTargetRoomFromCurrentRoomEvent,
  TRedisSendToRoomEvent,
} from '../Redis/Types/TRedisEvent';
import { ERedisSubEvents } from '../Redis/RedisSub/ERedisSubEvents';

class Room {
  constructor(
    private readonly roomName: string,
    private readonly pub = redisPub,
    private readonly sub = redisSub,
  ) {}

  get name() {
    return this.roomName;
  }

  joinSocketToRoom(ws: TWsServer, socketId: string) {
    return this.sub.joinToRoom(ws, this.roomName, socketId);
  }

  leaveFromRoom(socketId: string) {
    return this.sub.leaveFromRoom(this.roomName, socketId);
  }

  joinToTargetRoom(payload: TRedisCurrentRoomJoinToTargetRoomEvent['payload']) {
    return this.pub.joinCurrentRoomToTargetRoom(this.roomName, {
      event: ERedisSubEvents.currentRoomJoinToTargetRoom,
      payload,
    });
  }

  sendToRoom(payload: TRedisSendToRoomEvent['payload']) {
    return this.pub.sendToRoom(this.roomName, {
      event: ERedisSubEvents.sendToRoom,
      payload,
    });
  }

  kickTargetRoom(payload: TRedisKickTargetRoomFromCurrentRoomEvent['payload']) {
    return this.pub.kickTargetRoomFromCurrentRoom(this.roomName, {
      event: ERedisSubEvents.kickTargetRoomFromCurrentRoom,
      payload,
    });
  }
}

export { Room };
