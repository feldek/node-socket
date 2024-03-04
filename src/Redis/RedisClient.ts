import {
  createClient,
  RedisClientOptions,
  RedisClientType,
  RedisDefaultModules,
  RedisFunctions,
  RedisModules,
  RedisScripts,
} from 'redis';
import { TRedisConfig } from './TRedisType';

type TRedisClient = RedisClientType<
RedisDefaultModules & RedisModules,
RedisFunctions,
RedisScripts
>;

const getClientName = (clientName: string | undefined): string =>
  clientName ? `(${clientName})` : '';

/** todo replace {@link RedisClientWrapper} */
const createRedisClient = (
  config: TRedisConfig,
  options?: Partial<RedisClientOptions>,
): TRedisClient => {
  const database = config.database ?? 0;

  const redis = createClient({
    url: `redis://:${config?.password ?? ''}@${config.host}:${config.port}`,
    database: database,
    ...options,
  });

  redis.on('error', (error) => {
    console.error(`Error on redis${getClientName(config.clientName)}:`, error);
  });

  redis.on('ready', () => {
    console.debug(`Connected to redis${getClientName(config.clientName)}`);
  });

  return redis;
};

export { createRedisClient };
export type { TRedisConfig, TRedisClient };
