import {AdvancedWebSocket} from "./AdvancedWebSocket";

export interface IAdvancedWebSocketOptions {
    connectionTimeout?: number;
    retryPolicy?: (attempt: number, ws: AdvancedWebSocket) => number;
}