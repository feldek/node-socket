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
    return this.sub.joinSocket(ws, this.roomName, socketId);
  }

  leaveSocketFromRoom(socketId: string) {
    return this.sub.leaveSocket(this.roomName, socketId);
  }

  joinRoom(payload: TRedisCurrentRoomJoinToTargetRoomEvent['payload']) {
    return this.pub.joinRoom(payload.roomName, {
      event: ERedisSubEvents.joinRoom,
      payload: { roomName: this.roomName },
    });
  }

  sendToRoom(payload: TRedisSendToRoomEvent['payload']) {
    return this.pub.sendToRoom(this.roomName, {
      event: ERedisSubEvents.sendToRoom,
      payload,
    });
  }

  leaveRoom(payload: TRedisKickTargetRoomFromCurrentRoomEvent['payload']) {
    return this.pub.leaveRoom(payload.roomName, {
      event: ERedisSubEvents.leaveRoom,
      payload: { roomName: this.roomName },
    });
  }
}

export { Room };
