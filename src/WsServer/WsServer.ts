import { TemplatedApp } from 'uWebSockets.js';
import { TWsServer } from './Type/WsServer';
import { redisSub } from '../Redis/RedisSub/RedisSub';
import { redisPub } from '../Redis/RedisPub/RedisPub';
import { delay } from '../Utils/Delay';
import { v4 as uuid } from 'uuid';
import { ERedisSubEvents } from '../Redis/RedisSub/ERedisSubEvents';

class WsServer {
  constructor(readonly server: TemplatedApp) {}

  public async connected() {
    this.server.ws('/*', {
      upgrade: (res, req, context) => {
        // request was made to open websocket, res req have all properties for request, cookies etc
        // add code here to determine if ws request should be accepted or denied
        // deny request with "res.writeStatus('401').end()" see issue #367

        const headerProtocol = req.getHeader('sec-websocket-protocol');
        const header = headerProtocol.split(',');
        const userId = header[0];
        const token = header[1];
        console.log(headerProtocol);

        res.upgrade(
          // upgrade to websocket
          { ip: res.getRemoteAddress(), userId: userId, socketId: uuid() }, // 1st argument sets which properties to pass to ws object, in this case ip address
          req.getHeader('sec-websocket-key'),
          req.getHeader('sec-websocket-protocol'),
          req.getHeader('sec-websocket-extensions'), // 3 headers are used to setup websocket
          context, // also used to setup websocket
        );
      },

      // Open connection event
      open: async (ws: TWsServer) => {
        const roomName = 'testRoom';
        const roomName2 = 'testRoom2';

        await redisSub.addListener(ws, roomName);

        await delay(1_000);

        await redisPub.emit(roomName, {
          event: ERedisSubEvents.currentRoomJoinToTargetRoom,
          payload: { roomName: roomName2 },
        });

        await delay(1_000);

        await redisPub.emit(roomName2, {
          event: ERedisSubEvents.sendToRoom,
          payload: { roomName: 'subscribe in roomName2' },
        });
        // await redisPub.redis.publish(roomName, JSON.stringify({ emit: 2 }));

        // await delay(1_000);
        // await redisSub.removeListener(roomName, ws.getUserData().socketId);

        // await delay(1_000);
        // await redisPub.redis.publish(roomName, JSON.stringify({ emit: 4 }));
      },

      // Incoming message event
      message: (ws: TWsServer, message: ArrayBuffer, isBinary: boolean) => {
        const str = Buffer.from(message).toString();
        console.log('Received message:', str);

        // Echo the message back to the client
        // ws.send(Buffer.from(str));
        ws.send(str);
      },

      // Close connection event
      close: (ws: TWsServer, code: number, message: ArrayBuffer) => {
        console.log('A client disconnected');
      },
    });
  }

  //send to each ws connections
  public publish(message: string) {
    try {
      const msg = JSON.parse(message);

      // ws.send(Buffer.from(str));
    } catch (error) {
      console.error('ws-publish', error);
    }
  }
}

export { WsServer };
