import { ERedisSubEvents } from './ERedisSubEvents';
import { redisSub } from './RedisSub';
import { ERoomName } from '../../Constant/Enum/ERoomName';
import { redisPub } from '../RedisPub/RedisPub';

const handleRedisEvents = {
 [ERedisSubEvents.subscribeToRoom]: (params: { targetId: string; event: ERoomName }) => {
  const { targetId, event } = params;

  redisSub.listen(targetId, event);
 },
 [ERedisSubEvents.emitToRoom]: (params: {
  targetId: string;
  event: ERoomName;
  payload: any;
  socketSessionId: string;
 }) => {
  const { targetId, event, payload, socketSessionId } = params;

  redisPub.emit(targetId, event, socketSessionId, payload);
 },
};

export { handleRedisEvents };
