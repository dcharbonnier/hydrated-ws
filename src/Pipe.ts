import {Shell} from "./Shell";
import WebSocket from "./WebSocket";
import Event from "./Event";
import MessageEvent from "./MessageEvent";
import CloseEvent from "./CloseEvent";

export class Pipe extends Shell implements WebSocket {

    private channel: string;
    private prefixLength = 4;
    private pipeReadyState: number = null;

    constructor(ws: WebSocket, channel: string) {
        super();

        if (typeof(channel) !== "string" || !channel.length || channel.length > this.prefixLength) {
            throw new Error("Channel should be a string between 1 and 4 characters");
        }
        this.channel = `${Pipe.repeatString(" ", this.prefixLength)}${channel}`.slice(this.prefixLength * -1);
        this.ws = ws;
        this.addListeners();
    }

    private static repeatString(str: string, count: number): string {
        let res = "";
        for (let i = count; i > 0; i--) {
            res += str;
        }
        return res;
    }

    public close(code: number = 1000, reason?: string) {
        this.removeListeners();
        this.pipeReadyState = this.CLOSING;
        setTimeout(() => {
            this.pipeReadyState = this.CLOSED;
            this.dispatchEvent(new CloseEvent("close", {code, reason, wasClean: true}))
        }, 0);
    }

    send(data: any) {
        if (this.pipeReadyState) {
            return;
        }
        if (typeof(data) !== "string") {
            throw new Error(`MultiplexWebSocket only support sending string, passed a type ${typeof(data)}`);
        }
        super.send(this.channel + data);
    }

    public dispatchEvent(evt: Event): any {
        if (evt.type === "message") {
            const e: MessageEvent = evt as any;
            if (typeof(e.data) === "string" && this.channel === e.data.substr(0, this.prefixLength)) {
                super.dispatchEvent(new MessageEvent("message", {
                    data: e.data.substr(this.prefixLength),
                    origin: e.origin,
                    ports: e.ports,
                    source: e.source,
                }));
                return false;
            }
        } else {
            super.dispatchEvent(evt);
        }
    }

    protected getReadyState() {
        return this.pipeReadyState || super.getReadyState();
    }
}
