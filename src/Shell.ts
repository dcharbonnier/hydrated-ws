import IHydratedWebSocketEventMap from "./IHydratedWebSocketEventMap";
import { Dict } from "./polyfill/Dict";
import WebSocket from "./polyfill/WebSocket";

export abstract class Shell implements WebSocket {

    /** The connection is not yet open. */
    public readonly CONNECTING = WebSocket.CONNECTING;
    /**  The connection is open and ready to communicate. */
    public readonly OPEN = WebSocket.OPEN;
    /**  The connection is in the process of closing. */
    public readonly CLOSING = WebSocket.CLOSING;
    /**  The connection is closed or couldn't be opened. */
    public readonly CLOSED = WebSocket.CLOSED;

    /**
     * A string indicating the type of binary data being transmitted by the connection.
     * This should be either "blob" if DOM Blob objects are being used or "arraybuffer"
     * if ArrayBuffer objects are being used.
     */
    public binaryType: "blob" | "arraybuffer";

    protected closing: boolean = false;
    protected ws: WebSocket;
    protected _readyState: number = WebSocket.CONNECTING;

    private readonly forwardListener: (evt: Event) => boolean;
    private _onerror: (ev: Event) => any;
    private _onmessage: (ev: MessageEvent) => any;
    private _onopen: (ev: Event) => any;
    private _onclose: (ev: CloseEvent) => any;
    private listeners: Dict<keyof IHydratedWebSocketEventMap,
        Array<{
            listener: (this: WebSocket,
                       ev: IHydratedWebSocketEventMap[keyof IHydratedWebSocketEventMap]) => any,
            useCapture?: boolean,
        }>> = new Dict();

    constructor(ws?: WebSocket) {
        if (!this.dispatchEvent) {
            throw new TypeError("Failed to construct. Please use the 'new' operator");
        }
        this.forwardListener = this.dispatchEvent.bind(this);
        if (ws) {
            this.ws = ws;
            this.forwardEvents();
        }
    }

    /**
     * An event listener to be called when the WebSocket connection's **readyState** changes to **CLOSED**.
     * The listener receives a _CloseEvent_ named "close".
     */
    public get onclose(): (ev: CloseEvent) => any {
        return this._onclose;
    }

    public set onclose(f: (ev: CloseEvent) => any) {
        this._onclose = f;
    }

    /**
     * An event listener to be called when an error occurs. This is a simple event named "error".
     */
    public get onerror(): (ev: Event) => any {
        return this._onerror;
    }

    public set onerror(f: (ev: Event) => any) {
        this._onerror = f;
    }

    /**
     * An event listener to be called when a message is received from the server.
     * The listener receives a _MessageEvent_ named "message".
     */
    public get onmessage(): (ev: MessageEvent) => any {
        return this._onmessage;
    }

    public set onmessage(f: (ev: MessageEvent) => any) {
        this._onmessage = f;
    }

    /**
     * An event listener to be called when the WebSocket connection's readyState changes to **OPEN**;
     * this indicates that the connection is ready to send and receive data.
     * The event is a simple one with the name "open".
     */
    public get onopen(): (ev: Event) => any {
        return this._onopen;
    }

    public set onopen(f: (ev: Event) => any) {
        this._onopen = f;
    }

    /**
     * The current state of the connection; this is one of the Ready state constants. **Read only.**
     */
    public get readyState(): number {
        return this.getReadyState();
    }

    /**
     * The URL as resolved by the constructor. This is always an absolute URL. **Read only.**
     */
    public get url(): string {
        return this.ws.url;
    }

    /**
     * The number of bytes of data that have been queued using calls to _send()_ but not yet transmitted to the network.
     * This value resets to zero once all queued data has been sent. This value does not reset to zero when the
     * connection is closed; if you keep calling _send()_, this will continue to climb. **Read only**
     */
    public get bufferedAmount(): number {
        return this.ws.bufferedAmount;
    }

    /**
     * The extensions selected by the server. This is currently only the empty string or a list
     * of extensions as negotiated by the connection.
     */
    public get extensions(): string {
        return this.ws.extensions;
    }

    public get protocol(): string {
        return this.ws.protocol;
    }

    /**
     * Closes the WebSocket connection or connection attempt, if any.
     * If the connection is already CLOSED, this method does nothing.
     * @param {number} A numeric value indicating the status code explaining why the connection is being closed.
     * If this parameter is not specified, a default value of 1005 is assumed.
     * See the list of status codes https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes
     * on the CloseEvent page for permitted values.
     * @param {string} A human-readable string explaining why the connection is closing.
     * This string must be no longer than 123 bytes of UTF-8 text (not characters).
     */
    public close(code: number = 1000, reason?: string) {
        this.ws.close(code, reason);
    }

    /**
     * Enqueues the specified data to be transmitted to the server over the WebSocket connection,
     * increasing the value of bufferedAmount by the number of bytes needed to contain the data.
     * If the data can't be sent (for example, because it needs to be buffered but the buffer is full), t
     * he socket is closed automatically.
     * @param data The data to send to the server. It may be one of the following types:
     * - **USVString**
     * A text string. The string is added to the buffer in UTF-8 format, and the value of bufferedAmount is increased
     * by the number of bytes required to represent the UTF-8 string.
     * - **ArrayBuffer**
     * You can send the underlying binary data used by a typed array object; its binary data contents are queued in the
     * buffer, increasing the value of bufferedAmount by the requisite number of bytes.
     * - **Blob**
     * Specifying a Blob enqueues the blob's raw data to be transmitted in a binary frame. The value of bufferedAmount
     * is increased by the byte size of that raw data.
     * - **ArrayBufferView**
     * You can send any JavaScript typed array object as a binary frame; its binary data contents are queued in the
     * buffer, increasing the value of bufferedAmount by the requisite number of bytes.
     */
    public send(data: string | ArrayBuffer | Blob | ArrayBufferView): void {
        if (this.ws.readyState !== WebSocket.OPEN) {
            const err = new Error(
                `WebSocket is not open ws is ${this.ws.readyState}, local is ${this.readyState}`,
            );
            throw err;
        }
        this.ws.send(data);
    }

    /**
     * Register an event handler of a specific event type on the EventTarget.
     * @param {K} A case-sensitive string representing the event type to listen for.
     * @param {(ev: IHydratedWebSocketEventMap[K]) => any} The object which receives a notification
     * (an object that implements the Event interface) when an event of the specified type occurs.
     * This must be an object implementing the EventListener interface, or a JavaScript function.
     * @param {boolean} A Boolean indicating whether events of this type will be dispatched to the registered
     * listener before being dispatched to any EventTarget beneath it in the DOM tree.
     * Events that are bubbling upward through the tree will not trigger a listener designated to use capture.
     * Event bubbling and capturing are two ways of propagating events which occur in an element that is nested
     * within another element, when both elements have registered a handle for that event.
     * The event propagation mode determines the order in which elements receive the event.
     * See DOM Level 3 Events and JavaScript Event order for a detailed explanation.
     * If not specified, useCapture defaults to false.
     */
    public addEventListener<K extends keyof IHydratedWebSocketEventMap>(type: K,
                                                                        listener: (this: WebSocket,
                                                                                   ev: IHydratedWebSocketEventMap[K])
                                                                                  => any,
                                                                        useCapture?: boolean): void {
        let listeners = this.listeners.get(type);
        if (!listeners) {
            listeners = [];
            this.listeners.set(type, listeners);
        }
        listeners.push({ listener, useCapture });
    }

    /**
     * Removes an event listener from the EventTarget.
     * @param {K} A string which specifies the type of event for which to remove an event listener.
     * @param {(ev: IHydratedWebSocketEventMap[K]) => any} The EventListener
     * function of the event handler to remove from the event target.
     * @param {boolean} Specifies whether the EventListener to be removed is registered as a capturing
     * listener or not. If this parameter is absent, a default value of false is assumed.
     */
    public removeEventListener<K extends keyof IHydratedWebSocketEventMap>(type: K,
                                                                           listener: (this: WebSocket,
                                                                                      ev: IHydratedWebSocketEventMap[K])
                                                                                     => any,
                                                                           useCapture?: boolean): void {
        const listeners = this.listeners.get(type);
        if (listeners) {
            this.listeners.set(
                type,
                listeners.filter((l) => l.listener !== listener || l.useCapture !== useCapture),
            );
        }
    }

    /**
     * Dispatch an event to this EventTarget.
     * @param {} The Event object to be dispatched.
     * @returns {boolean} The return value is **false** if event is cancelable and at least one of the event
     * handlers which handled this event called Event.preventDefault(). Otherwise it returns true.
     */
    public dispatchEvent(evt: Event): boolean {
        const method = this[`_on${evt.type}`];
        if (typeof method === "function") {
            method.call(this, evt);
        }
        return (this.listeners.get(evt.type as keyof IHydratedWebSocketEventMap) || [])
            .some(({ listener }) => listener.call(this, evt) === false) === void 0;
    }

    protected forwardEvents<K extends keyof IHydratedWebSocketEventMap>(list?: K[]) {
        (list || ["close", "message", "open"] as K[]).forEach((event: K): void =>
            this.ws.addEventListener(event, this.forwardListener),
        );
    }

    protected stopForwardingEvents() {
        this.ws.removeEventListener("close", this.forwardListener);
        this.ws.removeEventListener("message", this.forwardListener);
        this.ws.removeEventListener("open", this.forwardListener);
    }

    protected getReadyState(): number {
        return this.ws.readyState;
    }

}
