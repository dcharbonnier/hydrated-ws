import {Dict} from "../polyfill/Dict";
import WebSocket from "../polyfill/WebSocket";
import {IRouterConnector} from "./IRouterConnector";
import {RoutedWebSocket} from "./RoutedWebSocket";

/**
 * ALPHA, do not use
 * The Router route messages from different servers
 */
export class Router {

    public _connector: IRouterConnector;

    private readonly localWebSockets: Dict<string, WebSocket> = new Dict();
    private readonly virtualWebSockets: Dict<string, RoutedWebSocket> = new Dict();

    public clear(): void {
        this.localWebSockets.keys().forEach((key) => this.delete(key));
        this.virtualWebSockets.keys().forEach((key) => this.delete(key));
    }

    public destroy() {
        this.localWebSockets.values().forEach((ws) => ws.close());
        this.virtualWebSockets.values().forEach((ws) => ws.close());
        this.clear();
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
            this._connector.onRequestReadyState = this.onRequestReadyState.bind(this);
        }
    }

    public onMessage(id: string, data: any): boolean {
        const ws = this.localWebSockets.get(id);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(data);
            return true;
        }
    }

    public onRequestReadyState(id: string, data: any): number {
        const ws = this.localWebSockets.get(id);
        if (ws && ws.readyState === WebSocket.OPEN) {
            return ws.readyState;
        }
    }

    public onStatus(id: string, status: number): void {
        if (status === WebSocket.OPEN && this.localWebSockets.has(id) &&
            this.localWebSockets.get(id) .readyState !== status) {
            if (this.virtualWebSockets.has(id)) {
                this.virtualWebSockets.get(id).setReadyState(WebSocket.CLOSED);
            }
            this.localWebSockets.delete(id);

        }
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
        if (this.localWebSockets.get(id) === ws) {
            return;
        }
        this.close(id, 1000, "Duplicate websocket");
        const openListener = () => this.emitState(id, ws);
        const messageListener = (event: MessageEvent) => this.emitMessage(id, event);
        const closeListener = (event) => {
            if (this.localWebSockets.get(id) === ws) {
                this.emitState(id, ws);
            }
        };
        ws.addEventListener("open", openListener);
        ws.addEventListener("message", messageListener);
        ws.addEventListener("close", closeListener);
        if (this.virtualWebSockets.has(id) && this.virtualWebSockets.get(id).readyState === ws.readyState) {
            this.virtualWebSockets.get(id).setReadyState(WebSocket.CLOSED);
        }
        this.localWebSockets.set(id, ws);
        this.emitState(id, ws);
    }

    public delete(id: string) {
        this.localWebSockets.delete(id);
        this.setReadyState(id, WebSocket.CLOSED);
    }

    public get(id: string): WebSocket {
        if (!this.virtualWebSockets.has(id)) {
            const routedWs = this.createRoutedWebsocket(id);
            this.virtualWebSockets.set(id, routedWs);
            if (this.localWebSockets.has(id)) {
                routedWs.setReadyState(this.localWebSockets.get(id).readyState);
            } else {
                if (this._connector) {
                    this._connector.requestReadyState(id)
                        .then((readyState) => {
                            if (readyState && !routedWs.readyState) {
                                routedWs.setReadyState(readyState);
                            }
                        })
                        .catch( () => void 0);
                }
            }
        }
        const ws = this.virtualWebSockets.get(id);
        return ws;
    }

    public onMessageSubscribe(id: string, ws: RoutedWebSocket) {
        if (this._connector) {
            this._connector.subscribe(id, ws);
        }
    }

    public onMessageUnsubscribe(id: string, ws: RoutedWebSocket) {
        if (this._connector) {
            this._connector.unsubscribe(id, ws);
        }
    }

    public broadcast(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        this.onBroadcast(data);
        if (this._connector) {
            this._connector.broadcast(data);
        }
    }

    private createRoutedWebsocket(id: string): RoutedWebSocket {
        return new RoutedWebSocket(
            (data: string | ArrayBufferLike | Blob | ArrayBufferView) => this.send(id, data),
            (code: number, reason: string) => this.close(id, code, reason),
            (vWs) => this.onMessageSubscribe(id, vWs),
            (vWs) => this.onMessageUnsubscribe(id, vWs),
        );
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
            this.virtualWebSockets.get(id).setReadyState(state);
        }
    }

    private emitMessage(id, event: MessageEvent) {
        if (this.localWebSockets.has(id) && this.virtualWebSockets.has(id)) {
            this.virtualWebSockets.get(id).emitMessage(event);
        }
        if (this._connector) {
            this._connector.emitMessage(id, event);
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
