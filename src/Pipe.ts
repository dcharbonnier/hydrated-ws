import {Shell} from "./Shell";
import WebSocket from "./WebSocket";
import Event from "./Event";
import MessageEvent from "./MessageEvent";

export class Pipe extends Shell implements WebSocket {

    public onMessageListener: (ev: MessageEvent) => any;
    public onEventListener: (ev: Event) => any;
    private channel: string;
    private prefixLength = 4;
    private pipeReadyState: number = null;

    private static repeatString(str: string, count: number): string {
        let res = "";
        for (let i = count; i > 0; i--) {
            res += str;
        }
        return res;
    }

    constructor(ws: WebSocket, channel: string) {
        super();

        if (typeof(channel) !== "string" || !channel.length || channel.length > this.prefixLength) {
            throw new Error("Channel should be a string between 1 and 4 characters");
        }
        this.channel = `${Pipe.repeatString(" ", this.prefixLength)}${channel}`.slice(this.prefixLength * -1);
        this.ws = ws;

        this.onMessageListener = this._onMessageListener.bind(this);
        this.onEventListener = this._onEventListener.bind(this);

        this.ws.addEventListener("message", this.onMessageListener);
        this.ws.addEventListener("close", this.onEventListener);
        this.ws.addEventListener("open", this.onEventListener);

    }

    protected getReadyState() {
        return this.pipeReadyState || super.getReadyState();
    }

    public close(code: number = 1000, reason?: string) {
        this.ws.removeEventListener("message", this.onMessageListener);
        this.ws.removeEventListener("close", this.onEventListener);
        this.ws.removeEventListener("open", this.onEventListener);
        this.pipeReadyState = this.CLOSING;
        setTimeout(()=> {
            this.pipeReadyState = this.CLOSED;
            this.dispatchEvent(new CloseEvent("close", {code, reason, wasClean: true}))
        }, 0);
    }

    private _onEventListener(event: Event) {
        this.dispatchEvent(event);
    }

    send(data: any) {
        if(this.pipeReadyState) {
            return;
        }
        if (typeof(data) !== "string") {
            throw new Error(`MultiplexWebSocket only support sending string, passed a type ${typeof(data)}`);
        }
        super.send(this.channel + data);
    }

    private _onMessageListener(e: MessageEvent): any {
        if (typeof( e.data) === "string" && this.channel === e.data.substr(0, this.prefixLength)) {
            this.dispatchEvent(new MessageEvent("message", {
                data: e.data.substr(this.prefixLength),
                origin: e.origin,
                ports: e.ports,
                source: e.source,
            }));
            return false;
        }
    }
}
