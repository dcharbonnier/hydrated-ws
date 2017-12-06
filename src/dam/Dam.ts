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
        } else if (evt.type === "message") {
            this.buffer.unshift(evt);
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

    private flush() {
        if (this._status === Dam.OPEN) {
            let evt: any;
            while (evt = this.buffer.pop()) { // tslint:disable-line:no-conditional-assignment
                super.dispatchEvent(evt);
            }
        }
    }

}
