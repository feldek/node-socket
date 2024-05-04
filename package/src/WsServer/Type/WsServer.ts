import { WebSocket } from 'uWebSockets.js';

type TUserData = {
  socketId: string;
  userId: string;
  ip: string;
};

type TWsServer = WebSocket<TUserData>;

export type { TWsServer, TUserData };
