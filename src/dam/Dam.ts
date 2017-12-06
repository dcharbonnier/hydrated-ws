import Event from "../polyfill/Event";
import WebSocket from "../polyfill/WebSocket";
import {Shell} from "../Shell";

export class Dam extends Shell implements WebSocket {

    public static OPEN = "OPEN";
    public static CLOSED = "CLOSED";

    private openSent: boolean = false;
    private _status: "OPEN" | "CLOSED" = "CLOSED";

    constructor(ws: WebSocket) {
        super();
        this._readyState = this.CLOSED;
        this.ws = ws;
        this.addListeners();
    }

    public get status() {
        return this._status;
    }

    public set status(value: "OPEN" | "CLOSED") {
        if (this._status === value) {
            return;
        }
        this._status = value;
        if (this._status === "OPEN") {
            if (this.ws.readyState === this.ws.OPEN) {
                this.dispatchEvent(new Event("open"));
            }
        }
    }

    public get readyState() {
        if (this.ws.readyState === this.CLOSED) {
            return this.CLOSED;
        }
        if (this._status === "CLOSED") {
            return this.CONNECTING;
        } else {
            return this.OPEN;
        }
    }

    public dispatchEvent(evt: Event): boolean {
        if (evt.type === "close") {
            super.dispatchEvent(evt);
            this.openSent = false;
        } else if (this._status === Dam.OPEN) {
            if (evt.type === "open") {
                if (!this.openSent) {
                    this.openSent = true;
                    super.dispatchEvent(evt);
                }
            } else {
                super.dispatchEvent(evt);
            }
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

}
