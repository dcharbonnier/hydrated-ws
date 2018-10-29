import {Waterfall} from "./Waterfall";

export interface IWaterfallOptions {
    /**
     * Time in ms before connection attempt timeout default to 5000
     */
    connectionTimeout?: number;

    /**
     * Emit e close event before reconnecting default to false
     */
    emitClose?: boolean;

    /**
     * Retry policy function default to exponentialTruncatedBackoff
     */
    retryPolicy?: (attempt: number, ws: Waterfall) => number;

    /**
     * Websocket factory
     */
    factory?: (url: string, protocols?: string | string[]) => WebSocket;
}
