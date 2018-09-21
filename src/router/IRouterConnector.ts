export interface IRouterConnector {
    onMessage?: (key: string, data: any) => boolean;
    onBroadcast?: (data: any) => void;
    onClose?: (key: string, code: number, reason: string) => boolean;
    send(key: string, data: any): void;
    broadcast(data: any): void;
    close(key: string, code: number, reason: string): void;
}
