import { WebSocket } from 'uWebSockets.js';

type TUserData = { id: string; ip: string };

type TWsServer = WebSocket<TUserData>;

export type { TWsServer, TUserData };
