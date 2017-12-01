import {Waterfall} from "./Waterfall";

export interface IWaterfallOptions {
    connectionTimeout?: number;
    retryPolicy?: (attempt: number, ws: Waterfall) => number;
    factory?: (url: string, protocols?: string | string[]) => WebSocket;
}