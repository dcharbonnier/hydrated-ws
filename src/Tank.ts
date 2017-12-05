import {Shell} from "./Shell";
import WebSocket from "./WebSocket";

export class Tank extends Shell implements WebSocket {

    private buffer: any[] = [];

    constructor(ws: WebSocket) {
        super();
        this.ws = ws;
        this.addListeners();
        this.addEventListener("open", () => this.flush());
        // @todo
        // The tank do not send twice an open event so the readyState can
        // change without an open or close event
        // detect this is a tank, add a readyState change event
        setInterval(() => this.flush(), 100);
    }

    public send(data: any) {
        if (!data) { return; }
        this.buffer.unshift(data);
        this.flush();
    }

    private flush() {
        if (this.ws.readyState === this.OPEN) {
            let d: any;
            while (d = this.buffer.pop()) { // tslint:disable-line:no-conditional-assignment
                this.ws.send(d);
            }
        }
    }

}
