import {ESocketEmitEvent} from "../../Constant/Enum/ESocketEmitEvent";
import {TSocketEmitEventPayloadMap} from "../../Constant/Enum/TSocketEmitEventPayloadMap";

type TSocketEmitPayload<EVENT extends ESocketEmitEvent> = {
    data: {
        event: EVENT,
        payload: TSocketEmitEventPayloadMap[EVENT]
    },
    id: string;
}

export {TSocketEmitPayload}