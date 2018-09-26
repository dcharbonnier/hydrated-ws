
import { Dict } from "../polyfill/Dict";
import WebSocket from "../polyfill/WebSocket";
import { IRouterConnector } from "./IRouterConnector";
import { RoutedWebSocket } from "./RoutedWebSocket";

export class Router {

    public _connector: IRouterConnector;

    private readonly localWebSockets: Dict<string, WebSocket> = new Dict();
    private readonly virtualWebSockets: Dict<string, RoutedWebSocket> = new Dict();

    public clear(): void {
        this.localWebSockets.keys().forEach((key) => this.delete(key));
    }

    public set connector(value: IRouterConnector) {
        if (this._connector) {
            this._connector.onBroadcast = void 0;
            this._connector.onMessage = void 0;
            this._connector.onClose = void 0;
            this._connector.onStatus = void 0;
        }
        this._connector = value;
        if (value) {
            this._connector.onBroadcast = this.onBroadcast.bind(this);
            this._connector.onMessage = this.onMessage.bind(this);
            this._connector.onClose = this.onClose.bind(this);
            this._connector.onStatus = this.onStatus.bind(this);
        }
    }

    public onMessage(id: string, data: any): boolean {
        const ws = this.localWebSockets.get(id);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(data);
            return true;
        }
    }

    public onStatus(id: string, status: number): void {
        const ws = this.virtualWebSockets.get(id);
        if (ws) {
            ws.setReadyState(status);
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

    public emitState(id: string, ws: WebSocket) {
        this.setReadyState(id, ws.readyState);
        if (this._connector) {
            this._connector.readyState(id, ws.readyState);
        }
    }

    public set(id: string, ws: WebSocket) {
        this.close(id, 1000, "Duplicate websocket");
        ws.addEventListener("open", () => this.emitState(id, ws));
        ws.addEventListener("close", () => this.emitState(id, ws));
        this.localWebSockets.set(id, ws);
        this.emitState(id, ws);
    }

    public delete(id: string) {
        this.localWebSockets.delete(id);
        this.setReadyState(id, WebSocket.CLOSED);
    }

    public get(id: string): WebSocket {
        if (!this.virtualWebSockets.has(id)) {
            const ws = new RoutedWebSocket(
                (data: string | ArrayBufferLike | Blob | ArrayBufferView) => this.send(id, data),
                (code: number, reason: string) => this.close(id, code, reason),
            );
            this.virtualWebSockets.set(id, ws);
            if (this.localWebSockets.has(id)) {
                ws.setReadyState(this.localWebSockets.get(id).readyState);
            }
        }
        return this.virtualWebSockets.get(id);

    }

    public broadcast(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        this.onBroadcast(data);
        if (this._connector) {
            this._connector.broadcast(data);
        }
    }

    private send(id: string, data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        const ws = this.localWebSockets.get(id);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        } else if (this._connector) {
            this._connector.send(id, data);
        }
    }

    private setReadyState(id, state: number) {
        if (this.virtualWebSockets.has(id)) {
            this.virtualWebSockets.get(id).setReadyState(WebSocket.CLOSED);
        }
    }

    private close(id: string, code: number, reason: string) {
        this.setReadyState(id, WebSocket.CLOSED);
        if (this.localWebSockets.has(id)) {
            this.localWebSockets.get(id).close(code, reason);
        } else if (this._connector) {
            this._connector.close(id, code, reason);
        }
    }

}
