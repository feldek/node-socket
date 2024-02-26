import { ESocketHandleEvent } from '../../Constant/Enum/ESocketHandleEvent';
import { TSocketHandleEventPayloadMap } from '../../Constant/Enum/TSocketHandleEventPayloadMap';
import { redisPub } from '../../Redis/RedisPub/RedisPub';
import { ERoomName } from '../../Constant/Enum/ERoomName';

const firstFunction = () => console.log('immortal');
const secondFunction = () => console.log('temporary');

const cbArray: [() => void] = [firstFunction];

const runCbArray = () => cbArray.forEach((it) => it());

type THandleSocketEvents = {
 [key in ESocketHandleEvent]: (
  payload: TSocketHandleEventPayloadMap[key],
  userId: string,
  sessionId: string,
 ) => void | Promise<void>;
};

const handleSocketEvents: THandleSocketEvents = {
 [ESocketHandleEvent.handle]: (
  payload: TSocketHandleEventPayloadMap[ESocketHandleEvent.handle],
  userId: string,
  sessionId: string,
 ) => {
  console.log(`handle socket events: ${ESocketHandleEvent.handle}`, payload);

  // runCbArray();

  redisPub.emit('userId', ERoomName.room2, sessionId, payload);
 },
 [ESocketHandleEvent.handle2]: (
  payload: TSocketHandleEventPayloadMap[ESocketHandleEvent.handle2],
  userId: string,
  sessionId: string,
 ) => {
  console.log(`handle socket events: ${ESocketHandleEvent.handle2}`, payload);

  // redisSub.unsubCurrent('userId', ERoomName.room2, sessionId);
  // cbArray.push(secondFunction);
  // runCbArray();
  // redisSub.unsubCurrent(userId, ERoomName.room1, sessionId);
  // redisSub.unsubAll(userId, ERoomName.room2);
 },
 [ESocketHandleEvent.handle3]: (
  payload: TSocketHandleEventPayloadMap[ESocketHandleEvent.handle3],
  userId: string,
  sessionId: string,
 ) => {
  console.log(`handle socket events: ${ESocketHandleEvent.handle3}`, payload);

  cbArray.pop();
  // runCbArray();
 },
};

export { handleSocketEvents };
