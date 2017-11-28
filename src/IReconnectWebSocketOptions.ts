import {ReconnectWebSocket} from "./ReconnectWebSocket";

export interface IReconnectWebSocketOptions {
    connectionTimeout?: number;
    retryPolicy?: (attempt: number, ws: ReconnectWebSocket) => number;
}