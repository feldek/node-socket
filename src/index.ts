import { WsServer } from './WsServer/WsServer';
import { appConstants } from './Constant/Constants';
import { redisPubClient } from './Redis/RedisPub/RedisPub';
import { redisSubClient } from './Redis/RedisSub/RedisSub';
import { App } from 'uWebSockets.js';

// const server = http.createServer(app);
// const wsServer = new WsServerDeprecated(server);

Promise.all([redisPubClient.connect(), redisSubClient.connect()]).then(async (res) => {
 // await wsServer.connected();
 // Create a new uWebSockets.js App instance
 const app = App();
 const server = new WsServer(app);

 app.listen(appConstants.port, () => {
  console.log(`Server listen port ${appConstants.port}`);
 });

 server.connected();
 // server.listen(appConstants.port, () => {
 //  /* eslint-disable no-console */
 //  console.log(`Listening: http://${appConstants.host}`);
 //  /* eslint-enable no-console */
 // });
});
