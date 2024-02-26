import { TWsServer } from '../Type/WsServer';
import { redisSub } from '../../Redis/RedisSub/RedisSub';

class Room {
 constructor(private readonly name: string) {}

 socketJoinToRoom(ws: TWsServer) {
  redisSub.listenBase(this.name);
 }
}
