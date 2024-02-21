import { WebSocket } from 'isomorphic-ws';
import { ESocketHandleEvent } from '../Constant/Enum/ESocketHandleEvent';
import { TSocketHandleEventPayloadMap } from '../Constant/Enum/TSocketHandleEventPayloadMap';
import { TSocketHandlePayload } from '../WsServer/Type/TSocketHandlePayload';

class WsClient {
 private connection: WebSocket;
 //
 // private get connection(): WebSocket {
 //     const connection = this.connection;
 //
 //     if (!connection) {
 //         throw Error("Connection hasn't called")
 //     }
 //
 //     return connection
 // }
 //
 // private set connection(ws: WebSocket) {
 //     this.connection = ws
 // }

 constructor(
  private readonly host: string,
  readonly userId: string,
 ) {
  this.connection = new WebSocket(this.host, [userId, 'token']);
 }

 connect() {
  this.connection.onmessage = (data) => {
   try {
    console.log('Data WS event', data);
   } catch (error) {
    console.error(error);
   }
  };

  this.connection.onopen = (data) => {
   // console.error('Open WS event', data);
  };

  this.connection.onerror = (data) => {
   console.error('Error WS event', data);
  };

  this.connection.onclose = (data) => {
   console.error('Close WS event', data);
  };
 }

 publish<EVENT extends ESocketHandleEvent>(
  event: EVENT,
  payload: TSocketHandleEventPayloadMap[EVENT],
 ) {
  const message: TSocketHandlePayload<EVENT> = {
   id: 'asda',
   data: {
    event,
    payload,
   },
  };

  this.connection.send(JSON.stringify(message));
 }
}

export { WsClient };
