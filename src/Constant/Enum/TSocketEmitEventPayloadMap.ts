import { ESocketEmitEvent } from './ESocketEmitEvent';

type TSocketEmitEventPayloadMap = {
  [ESocketEmitEvent.emit]: { payloadTest1: string },
  [ESocketEmitEvent.emit2]: { payloadTest2: string },
  [ESocketEmitEvent.emit3]: { payloadTest3: string },
};

export { TSocketEmitEventPayloadMap };