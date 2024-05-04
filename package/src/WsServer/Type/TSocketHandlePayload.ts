import { ESocketEmitEvent } from '../../Constant/Enum/ESocketEmitEvent';
import { TSocketEmitEventPayloadMap } from '../../Constant/Enum/TSocketEmitEventPayloadMap';
import { TSocketHandleEventPayloadMap } from '../../Constant/Enum/TSocketHandleEventPayloadMap';
import { ESocketHandleEvent } from '../../Constant/Enum/ESocketHandleEvent';

type TSocketHandlePayload<EVENT extends ESocketHandleEvent> = {
  data: {
    event: EVENT,
    payload: TSocketHandleEventPayloadMap[EVENT]
  },
  id: string;
};

export { TSocketHandlePayload };
