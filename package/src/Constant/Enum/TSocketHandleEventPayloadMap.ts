import { ESocketHandleEvent } from './ESocketHandleEvent';

type TSocketHandleEventPayloadMap = {
  [ESocketHandleEvent.handle]: { payloadHandle1: string },
  [ESocketHandleEvent.handle2]: { payloadHandle2: string },
  [ESocketHandleEvent.handle3]: { payloadHandle3: string },
};

export { TSocketHandleEventPayloadMap };