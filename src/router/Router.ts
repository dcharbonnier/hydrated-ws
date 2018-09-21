
import { Dict } from "../polyfill/Dict";
import WebSocket from "../polyfill/WebSocket";
import { IRouterConnector } from "./IRouterConnector";
import { RoutedWebSocket } from "./RoutedWebSocket";

export class Router {

    public _connector: IRouterConnector;

    private readonly localWebSockets: Dict<string, WebSocket> = new Dict();
    private readonly remoteWebSockets: Dict<string, RoutedWebSocket> = new Dict();

    public clear(): void {
        this.localWebSockets.clear();
    }

    public set connector(value: IRouterConnector) {
        if (this._connector) {
            this._connector.onBroadcast = void 0;
            this._connector.onMessage = void 0;
            this._connector.onClose = void 0;
        }
        this._connector = value;
        if (value) {
            this._connector.onBroadcast = this.onBroadcast.bind(this);
            this._connector.onMessage = this.onMessage.bind(this);
            this._connector.onClose = this.onClose.bind(this);
        }
    }

    public onMessage(id: string, data: any): boolean {
        const ws = this.localWebSockets.get(id);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(data);
            return true;
        }
    }

    public onBroadcast(data: any): void {
        this.localWebSockets.values().forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        });
    }

    public onClose(id: string, code: number, reason: string): boolean {
        const ws = this.localWebSockets.get(id);
        if (ws) {
            ws.close(code, reason);
            return true;
        }
    }

    public set(id: string, ws: WebSocket) {
        this.close(id, 1000, "Duplicate websocket");
        this.localWebSockets.set(id, ws);
    }

    public delete(id: string) {
        this.localWebSockets.delete(id);
    }

    public get(id: string): WebSocket {
        if (this.localWebSockets.has(id)) {
            return this.localWebSockets.get(id);
        } else if (this.remoteWebSockets.has(id)) {
            return this.remoteWebSockets.get(id);
        } else {
            const ws = new RoutedWebSocket(
                (data: string | ArrayBufferLike | Blob | ArrayBufferView) => this.send(id, data),
                (code: number, reason: string) => this.close(id, code, reason),
            );
            this.remoteWebSockets.set(id, ws);
            return ws;
        }
    }

    public broadcast(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        this.localWebSockets.values().forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        });
        if (this._connector) {
            this._connector.broadcast(data);
        }
    }

    private send(id: string, data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        if (this._connector) {
            this._connector.send(id, data);
        }
    }

    private close(id: string, code: number, reason: string) {
        if (this.localWebSockets.has(id)) {
            this.localWebSockets.get(id).close(code, reason);
        } else if (this._connector) {
            this._connector.close(id, code, reason);
        }
    }

}
