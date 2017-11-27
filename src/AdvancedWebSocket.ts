import {IAdvancedWebSocketOptions} from "./IAdvancedWebSocketOptions";
import {Dict} from "./Dict";
import {exponentialTruncatedBackoff} from "./exponentialTruncatedBackoff";

export class AdvancedWebSocket implements WebSocket {

    public readonly CLOSED = WebSocket.CLOSED;
    public readonly CLOSING = WebSocket.CLOSING;
    public readonly CONNECTING = WebSocket.CONNECTING;
    public readonly OPEN = WebSocket.OPEN;
    public binaryType: "blob" | "arraybuffer";
    public onclose: (this: WebSocket, ev: CloseEvent) => any;
    public onerror: (this: WebSocket, ev: Event) => any;
    public onmessage: (this: WebSocket, ev: MessageEvent) => any;
    public onopen: (this: WebSocket, ev: Event) => any;
    private timeout: Timer;
    private connectionTimeout: number = 1000;
    private retryPolicy: (attempt: number, ws: AdvancedWebSocket) => number;
    private listeners: Dict<keyof WebSocketEventMap,
        { listener: (this: WebSocket, ev: WebSocketEventMap[keyof WebSocketEventMap]) => any, useCapture?: boolean }[]>
        = new Dict();
    private ws: WebSocket;
    private closing: boolean = false;

    public constructor(public readonly url: string, private protocols?: string | string[], options?: IAdvancedWebSocketOptions) {
        if (this.constructor !== AdvancedWebSocket) {
            // Throw a native WebSocket error
            (WebSocket as any)(url);
        }
        this.connectionTimeout = (options && options.connectionTimeout) || this.connectionTimeout;
        this.retryPolicy = (options && options.retryPolicy) || exponentialTruncatedBackoff();
        this.open();
    }

    private _readyState: number = WebSocket.CONNECTING;

    public get readyState(): number {
        return this._readyState;
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
        if (this.closing) {
            return;
        }
        this.closing = true;
        clearTimeout(this.timeout);
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

    private open(attempt: number = 0) {
        const ws = new WebSocket(this.url, this.protocols || []);
        ws.binaryType = this.binaryType;
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            try {
                ws.close();
            } catch (e) {
            }
            const timeout = this.retryPolicy(attempt + 1, this);
            if (timeout === null) {
                this._readyState = WebSocket.CLOSED;
                this.dispatchEvent(new CloseEvent("close", {code:4000, reason: "Connect timeout"}));
            } else {
                setTimeout(() => this.open(attempt + 1), timeout);
            }
        }, this.connectionTimeout);

        ws.onopen = (event: Event) => {
            attempt = 0;
            clearTimeout(this.timeout);
            this._readyState = WebSocket.OPEN;
            this.dispatchEvent(event);
        };
        ws.onclose = (event) => {
            clearTimeout(this.timeout);
            if (this.closing) {
                this._readyState = WebSocket.CLOSED;
                this.dispatchEvent(event);
            } else {
                const timeout = this.retryPolicy(attempt + 1, this);
                if (timeout === null) {
                    this._readyState = WebSocket.CLOSED;
                    this.dispatchEvent(event);
                } else {
                    this._readyState = WebSocket.CONNECTING;
                    setTimeout(() => this.open(attempt + 1), timeout);
                }

            }
        };
        ws.onmessage = (event) => {
            this.dispatchEvent(event);
        };
        ws.onerror = (event) => {
            this.dispatchEvent(event);
        };
        this.ws = ws;

    }

}