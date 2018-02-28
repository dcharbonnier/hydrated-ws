import Event from "../polyfill/Event";
import WebSocket from "../polyfill/WebSocket";
import {Shell} from "../Shell";

export class Dam extends Shell implements WebSocket {

    public static OPEN: string = "OPEN";
    public static CLOSED: string = "CLOSED";

    private openSent: boolean = false;
    private buffer: any[] = [];
    private _status: "OPEN" | "CLOSED" = "CLOSED";

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

    public get readyState() {
        if (this.ws.readyState === this.ws.CLOSED) {
            return this.CLOSED;
        }
        if (this._status === Dam.CLOSED) {
            return this.CONNECTING;
        } else {
            return this.OPEN;
        }
    }

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

    public send(data: any) {
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
