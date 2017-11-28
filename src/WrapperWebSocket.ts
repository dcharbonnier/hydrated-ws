import {Dict} from "./Dict";

export class WrapperWebSocket implements WebSocket {

    public readonly CLOSED = WebSocket.CLOSED;
    public readonly CLOSING = WebSocket.CLOSING;
    public readonly CONNECTING = WebSocket.CONNECTING;
    public readonly OPEN = WebSocket.OPEN;
    public binaryType: "blob" | "arraybuffer";
    public onclose: (this: WebSocket, ev: CloseEvent) => any;
    public onerror: (this: WebSocket, ev: Event) => any;
    public onmessage: (this: WebSocket, ev: MessageEvent) => any;
    public onopen: (this: WebSocket, ev: Event) => any;

    protected closing: boolean = false;
    protected ws: WebSocket;

    private listeners: Dict<keyof WebSocketEventMap,
        { listener: (this: WebSocket, ev: WebSocketEventMap[keyof WebSocketEventMap]) => any, useCapture?: boolean }[]>
        = new Dict();

    protected _readyState: number = WebSocket.CONNECTING;

    public get readyState(): number {
        return this.ws.readyState;
    }

    public get url(): string {
        return this.ws.url;
    }

    public get bufferedAmount(): number {
        return this.ws.bufferedAmount;
    }

    public get extensions(): string {
        return this.ws.extensions;
    }

    public get protocol(): string {
        return this.ws.protocol;
    }

    public close(code: number = 1000, reason?: string) {
        this.ws.close(code, reason);
    }

    public send(data: any): void {
        this.ws.send(data);
    }

    public addEventListener<K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, useCapture?: boolean): void {
        let listeners = this.listeners.get(type);
        if (!listeners) {
            listeners = [];
            this.listeners.set(type, listeners);
        }
        listeners.push({listener, useCapture});
    }

    public removeEventListener<K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, useCapture?: boolean): void {
        let listeners = this.listeners.get(type);
        if (listeners) {
            this.listeners.set(type, listeners.filter(l => l.listener !== listener || l.useCapture !== useCapture));
        }
    }

    public dispatchEvent(evt: Event): boolean {
        if (typeof (this as any)[`on${evt.type}`] === "function") {
            (this as any)[`on${evt.type}`](evt);
        }
        let listeners = this.listeners.get(evt.type as keyof WebSocketEventMap);
        if (listeners) {
            for (let {listener, useCapture} of listeners) {
                if (listener.call(this, evt) === false) {
                    return false;
                }
            }
        }
        return true;
    }

}