import { WebSocket } from 'ws';
import { TSocketHandlePayload } from '../Type/TSocketHandlePayload';
import { ESocketHandleEvent } from '../../Constant/Enum/ESocketHandleEvent';
import { handleSocketEvents } from '../HandleEvents/HandleSocketEvents';

class WsConnectionClient {
 constructor(
  private readonly ws: WebSocket,
  protected readonly userId: string,
  protected readonly socketSessionId: string,
 ) {}

 onMessage() {
  this.ws.on('message', async (message) => {
   try {
    const msg = JSON.parse(message.toString()) as TSocketHandlePayload<ESocketHandleEvent.handle2>;

    const handler = handleSocketEvents[msg.data.event];

    if (typeof handler !== 'function') {
     throw Error(`Doesn't have handler for event:  ${msg.data.event}`);
    }

    handleSocketEvents[msg.data.event](msg.data.payload, this.userId, this.socketSessionId);
    //@ts-ignore

    // console.log("ws onMessage", msg)
   } catch (error) {
    console.log('error server on', error);
   }
  });
 }

 onClose() {
  this.ws.on('close', (data) => {
   console.log('ws onClose', data);
  });
 }

 onError() {
  this.ws.on('error', (err) => {
   console.log('ws onError connection', err);
  });
 }
}

export { WsConnectionClient };
