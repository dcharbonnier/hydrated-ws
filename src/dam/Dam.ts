import Event from "../polyfill/Event";
import WebSocket from "../polyfill/WebSocket";
import {Shell} from "../Shell";

/**
 * The Dam simulate a Websocket Opening and Closing
 * Example of use include simulating a connection opening after an authentication
 *
 * @example
 * ```typescript
 *
 * const dam = new Dam(ws);
 * expect(dam.send("test")).to.throw;
 * dam.status = Dam.OPEN;
 * \// the open event is also dispatched
 * expect(dam.send("test")).to.not.throw;
 * ```
 */

export class Dam extends Shell {

    /**  The dam is open and will let messages pass through */
    public static OPEN: string = "OPEN";

    /**  The dam is closed and will stop the messages */
    public static CLOSED: string = "CLOSED";

    private openSent: boolean = false;
    private buffer: any[] = [];
    private _status: "OPEN" | "CLOSED" = "CLOSED";

    /**
     * The created Dam will be *CLOSED*
     * @param ws  An object compatible with the WebSocket interface.
     */
    constructor(ws: WebSocket) {
        super();
        this._readyState = this.CLOSED;
        this.ws = ws;
        this.forwardEvents();
    }

    public get status() {
        return this._status;
    }

    public set status(value: "OPEN" | "CLOSED") {
        if (this._status === value) {
            return;
        }
        this._status = value;
        if (this._status === Dam.OPEN) {
            if (this.ws.readyState === this.ws.OPEN) {
                this.dispatchEvent(new Event("open"));
            }
            this.flush();
        }
    }

    /**
     * Compatible with the WebSocket readyState, combining the _status_ of the _Dam_ and the ready state
     * of the underlying WebSocket
     * @returns {number} WebSocket constants (CONNECTING, OPEN, CLOSING, CLOSED)
     */
    public get readyState() {
        if (this._status === Dam.CLOSED &&
            (this.ws.readyState === this.ws.CONNECTING || this.ws.readyState === this.ws.OPEN) ) {
            return this.CONNECTING;
        } else {
            return this.ws.readyState;
        }
    }

    /**
     * Dispatch an event, some event are delayed if the Dam is CLOSED
     * @param {} The Event object to be dispatched.
     * @returns {boolean} The return value is **false** if event is cancelable and at least one of the event
     * handlers which handled this event called Event.preventDefault(). Otherwise it returns true.
     */
    public dispatchEvent(evt: Event): boolean {
        if (evt.type === "close") {
            this.dispatchCloseEvent(evt);
        } else if (evt.type === "open") {
            this.dispatchOpenEvent(evt);
        } else {
            this.dispatchOrBuffer(evt);
        }
        return true;
    }

    /**
     * Same as the send method of the WebSocket except that this will throw an error if the Dam is closed
     * @param data The data to send to the server. It may be one of the following types:
     * - **USVString**
     * A text string. The string is added to the buffer in UTF-8 format, and the value of bufferedAmount is increased
     * by the number of bytes required to represent the UTF-8 string.
     * - **ArrayBuffer**
     * You can send the underlying binary data used by a typed array object; its binary data contents are queued in
     * the buffer, increasing the value of bufferedAmount by the requisite number of bytes.
     * - **Blob**
     * Specifying a Blob enqueues the blob's raw data to be transmitted in a binary frame. The value of bufferedAmount
     * is increased by the byte size of that raw data.
     * - **ArrayBufferView**
     * You can send any JavaScript typed array object as a binary frame; its binary data contents are queued in the
     * buffer, increasing the value of bufferedAmount by the requisite number of bytes.
     */
    public send(data: string| ArrayBuffer | Blob | ArrayBufferView ): void {
        if (this._status === Dam.OPEN) {
            super.send(data);
        } else {
            throw new Error("WebSocket is closed");
        }
    }

    private dispatchCloseEvent(evt: Event) {
        super.dispatchEvent(evt);
        this.openSent = false;
    }

    private dispatchOpenEvent(evt: Event) {
        if (this._status === Dam.OPEN) {
            super.dispatchEvent(evt);
            this.openSent = true;
        }
    }

    private dispatchOrBuffer(evt: Event) {
        if (this._status === Dam.OPEN) {
            super.dispatchEvent(evt);
        } else {
            this.buffer.unshift(evt);
        }
    }

    private flush() {
        let evt: any;
        while (evt = this.buffer.pop()) { // tslint:disable-line:no-conditional-assignment
            super.dispatchEvent(evt);
        }
    }

}
