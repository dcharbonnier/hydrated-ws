import {RoutedWebSocket} from "./RoutedWebSocket";

export interface IRouterConnector {
    onMessage?: (key: string, data: any) => boolean;
    onBroadcast?: (data: any) => void;
    onStatus?: (key: string, status: number) => void;
    onClose?: (key: string, code: number, reason: string) => boolean;
    onRequestReadyState?: (key: string) => number;

    send(key: string, data: any): void;

    broadcast(data: any): void;

    readyState(key: string, status: number): void;

    close(key: string, code: number, reason: string): void;

    requestReadyState(key: string): Promise<number>;

    subscribe(key: string, ws: RoutedWebSocket);

    unsubscribe(key: string, ws: RoutedWebSocket);

    emitMessage(key: string, event: MessageEvent): void;
}
