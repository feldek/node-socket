import { WsClient } from './WsClient';
import { appConstants } from '../Constant/Constants';
import { ESocketHandleEvent } from '../Constant/Enum/ESocketHandleEvent';

const wsClient1 = new WsClient(`ws://${appConstants.host}`, 'user_1111');
const wsClient2 = new WsClient(`ws://${appConstants.host}`, 'user_2222');

const delay = (delay: number) => new Promise((res) => setTimeout(res, delay));

const bootstrap = async () => {
 await wsClient1.connect();
 await wsClient2.connect();

 // await delay(500);
 // wsClient1.publish(ESocketHandleEvent.handle, { payloadHandle1: '111' });

 // await delay(500);
 //
 // //unsub common room
 // wsClient2.publish(ESocketHandleEvent.handle2, { payloadHandle2: '222' });

 await delay(250);
 wsClient2.publish(ESocketHandleEvent.handle, { payloadHandle1: 'push with user2' });

 await delay(250);
 //unsub common room
 wsClient2.publish(ESocketHandleEvent.handle2, { payloadHandle2: '222' });

 await delay(250);
 wsClient2.publish(ESocketHandleEvent.handle, { payloadHandle1: 'push without user2' });
 // await delay(500);
 // wsClient.publish(ESocketHandleEvent.handle, { payloadHandle1: '11113' });

 // await delay(500);
 // wsClient.publish(ESocketHandleEvent.handle3, { payloadHandle3: '333' });
};

void bootstrap();
