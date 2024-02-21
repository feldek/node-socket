import {RedisClientType, RedisDefaultModules, RedisFunctions, RedisModules, RedisScripts} from "redis";

type TRedisBase = RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts>;

type TRedisConfig = {
    clientName?: string;
    host: string;
    port: number;
    password: string;
    database?: number;
}

interface IGetRedisInstance {
    getInstance: () => TRedisBase;
}

export type {TRedisConfig, IGetRedisInstance, TRedisBase}