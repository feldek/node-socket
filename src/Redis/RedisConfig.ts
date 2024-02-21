import {TRedisConfig} from "./TRedisType";


const getRedisConfig = (target: string): TRedisConfig  => ({
  clientName: target,
  host: "127.0.0.1",
  port: 6379,
  password: "root",
  database: 0,
});

export { getRedisConfig };
