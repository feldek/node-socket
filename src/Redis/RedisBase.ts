import { TRedisBase } from './TRedisType';
import { ERoomName } from '../Constant/Enum/ERoomName';

abstract class RedisBase {
 protected constructor(readonly redis: TRedisBase) {}

 protected generatePubSubKeyCurrentSession<T extends ERoomName>(
  userId: string,
  event: T,
  socketSessionId: string,
 ) {
  return `${userId}.${event}.${socketSessionId}`;
 }

 protected generatePubSubKeyForAllSessions<T extends ERoomName>(userId: string, event: T) {
  return `${userId}.${event}.*`;
 }
}

export { RedisBase };
