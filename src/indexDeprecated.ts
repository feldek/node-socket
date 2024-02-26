import app from './app';
import http from 'http';
import { WsServerDeprecated } from './WsServer/WsServerDeprecated';
import { appConstants } from './Constant/Constants';
import { redisPubClient } from './Redis/RedisPub/RedisPub';
import { redisSubClient } from './Redis/RedisSub/RedisSub';

const server = http.createServer(app);
const wsServer = new WsServerDeprecated(server);

Promise.all([redisPubClient.connect(), redisSubClient.connect()]).then(async (res) => {
 await wsServer.connected();

 server.listen(appConstants.port, () => {
  /* eslint-disable no-console */
  console.log(`Listening: http://${appConstants.host}`);
  /* eslint-enable no-console */
 });
});
