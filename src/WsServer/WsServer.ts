import { Server, WebSocket, WebSocketServer } from 'ws';
import { Server as HttpServer } from 'http';
import { TSocketHandlePayload } from './Type/TSocketHandlePayload';
import { ESocketHandleEvent } from '../Constant/Enum/ESocketHandleEvent';
import { handleSocketEvents } from './HandleEvents/HandleSocketEvents';
import { redisSub } from '../Redis/RedisSub/RedisSub';
import { ERoomName } from '../Constant/Enum/ERoomName';
import { WsConnectionClient } from './WsConnectionClient/WsConnectionClient';
import { v4 as uuid } from 'uuid';

type TEventHandler<Req, Res> = (payload: Req) => Promise<Res>;

type TSocketCallback<Res> = (res: Promise<void>) => void;

class WsServer {
 public server: Server;

 constructor(server: HttpServer) {
  this.server = new WebSocketServer({ server });
 }

 // onSocketEventFactory(ws: WebSocket) {
 //     return <T extends ESocketHandleEvent>(
 //         event: T,
 //         callback: (payload: TSocketHandleEventPayloadMap[T]) => void | Promise<void>) =>
 //         ws.on("message", async (message) => {
 //             try {
 //                 const msg = JSON.parse(message.toString()) as TSocketHandlePayload;
 //
 //                 //@ts-ignore
 //                 handleSocketEvents[msg.data.event](msg.data.payload);
 //                 console.log("ws onMessage", msg)
 //
 //             } catch (error) {
 //                 console.log("error server on", error)
 //             }
 //         });
 // }

 public async connected() {
  console.log('Ws Server started');

  this.server.on('connection', async (ws, req) => {
   const headerProtocol = req.headers['sec-websocket-protocol'] as string;
   const header = headerProtocol.split(',');
   const userId = header[0];
   const token = header[1];
   const socketSessionId = uuid();

   redisSub.listen(userId, ERoomName.room1);
   redisSub.listen('userId', ERoomName.room2);

   //accepts msg from ws client
   const wsConnectionClient = new WsConnectionClient(ws, userId, socketSessionId);

   wsConnectionClient.onMessage();
   wsConnectionClient.onError();
   wsConnectionClient.onClose();
  });

  this.server.on('error', (err) => {
   console.error('server onError', err);
  });
 }

 //send to each ws connections
 public publish(message: string) {
  try {
   const msg = JSON.parse(message);
  } catch (error) {
   console.error('ws-publish', error);
  }
 }
}

export { WsServer };
