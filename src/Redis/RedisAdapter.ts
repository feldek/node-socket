import { TemplatedApp } from 'uWebSockets.js';
import { TWsServer } from '../WsServer/Type/WsServer';
import { redisPubClient } from './RedisPub/RedisPub';
import { redisSubClient, redisSub } from './RedisSub/RedisSub';

class RedisAdapter {
  constructor(
    private readonly server: TemplatedApp,
  ) {
    server.ws('/*', {
      async close(ws: TWsServer, code, message) {
        const socketId = ws.getUserData().socketId;

        await redisSub.deleteListeners(socketId);
      },
    });
  }
  async connect() {
    await Promise.all([redisPubClient.connect(), redisSubClient.connect()]);
  }
}
