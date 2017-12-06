import {Dict} from "./polyfill/Dict";
import Event from "./polyfill/Event";
import WebSocket from "./polyfill/WebSocket";

export class Shell implements WebSocket {

    public readonly CLOSED = WebSocket.CLOSED;
    public readonly CLOSING = WebSocket.CLOSING;
    public readonly CONNECTING = WebSocket.CONNECTING;
    public readonly OPEN = WebSocket.OPEN;
    public binaryType: "blob" | "arraybuffer";

    protected closing: boolean = false;
    protected ws: WebSocket;
    protected _readyState: number = WebSocket.CONNECTING;

    private eventListener: (evt: Event) => boolean;
    private _onerror: (ev: Event) => any;
    private _onmessage: (ev: MessageEvent) => any;
    private _onopen: (ev: Event) => any;
    private _onclose: (ev: CloseEvent) => any;
    private listeners: Dict<keyof WebSocketEventMap,
        Array<{
            listener: (this: WebSocket,
                       ev: WebSocketEventMap[keyof WebSocketEventMap]) => any,
            useCapture?: boolean,
        }>> = new Dict();

    constructor() {
        if (!this.dispatchEvent) {
            throw new TypeError("Failed to construct. Please use the 'new' operator");
        }
        this.eventListener = this.dispatchEvent.bind(this);
    }

    public get onclose(): (ev: CloseEvent) => any {
        return this._onclose;
    }

    public set onclose(f: (ev: CloseEvent) => any) {
        this._onclose = f;
    }

    public get onerror(): (ev: Event) => any {
        return this._onerror;
    }

    public set onerror(f: (ev: Event) => any) {
        this._onerror = f;
    }

    public get onmessage(): (ev: MessageEvent) => any {
        return this._onmessage;
    }

    public set onmessage(f: (ev: MessageEvent) => any) {
        this._onmessage = f;
    }

    public get onopen(): (ev: Event) => any {
        return this._onopen;
    }

    public set onopen(f: (ev: Event) => any) {
        this._onopen = f;
    }

    public get readyState(): number {
        return this.getReadyState();
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

    public addEventListener<K extends keyof WebSocketEventMap>(type: K,
                                                               listener: (this: WebSocket,
                                                                          ev: WebSocketEventMap[K]) => any,
                                                               useCapture?: boolean): void {
        let listeners = this.listeners.get(type);
        if (!listeners) {
            listeners = [];
            this.listeners.set(type, listeners);
        }
        listeners.push({listener, useCapture});
    }

    public removeEventListener<K extends keyof WebSocketEventMap>(type: K,
                                                                  listener: (this: WebSocket,
                                                                             ev: WebSocketEventMap[K]) => any,
                                                                  useCapture?: boolean): void {
        const listeners = this.listeners.get(type);
        if (listeners) {
            this.listeners.set(
                type,
                listeners.filter((l) => l.listener !== listener || l.useCapture !== useCapture),
            );
        }
    }

    public dispatchEvent(evt: Event): boolean {
        if (typeof (this as any)[`_on${evt.type}`] === "function") {
            (this as any)[`_on${evt.type}`].call(this, evt);
        }
        const listeners = this.listeners.get(evt.type as keyof WebSocketEventMap);
        if (listeners) {
            for (const {listener, useCapture} of listeners) {
                if (listener.call(this, evt) === false) {
                    return false;
                }
            }
        }
        return true;
    }

    protected addListeners() {
        this.ws.addEventListener("close", this.eventListener);
        this.ws.addEventListener("message", this.eventListener);
        this.ws.addEventListener("open", this.eventListener);
    }

    protected removeListeners() {
        this.ws.removeEventListener("close", this.eventListener);
        this.ws.removeEventListener("message", this.eventListener);
        this.ws.removeEventListener("open", this.eventListener);
    }

    protected getReadyState(): number {
        return this.ws.readyState;
    }

}
