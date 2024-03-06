import { WsServer } from './WsServer/WsServer';
import { appConstants } from './Constant/Constants';
import { redisPubClient } from './Redis/RedisPub/RedisPub';
import { redisSubClient } from './Redis/RedisSub/RedisSub';
import { App } from 'uWebSockets.js';

Promise.all([redisPubClient.connect(), redisSubClient.connect()]).then(async (res) => {
  // Create a new uWebSockets.js App instance
  const app = App();
  const server = new WsServer(app);

  app.listen(appConstants.port, () => {
    console.log(`Server listen port ${appConstants.port}`);
  });

  server.connected();
});
