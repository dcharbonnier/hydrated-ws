import {WrapperWebSocket} from "./WrapperWebSocket";

export class MultiplexWebSocket extends WrapperWebSocket implements WebSocket {

    public onMessageListener: (ev: MessageEvent) => any;
    private channel: string;
    private prefixLength = 4;

    constructor(ws: WebSocket, channel: string) {
        super();

        if (typeof(channel) !== "string" || !channel.length || channel.length > this.prefixLength) {
            throw new Error("Channel should be a string between 1 and 4 characters");
        }
        this.channel = `${" ".repeat(this.prefixLength)}${channel}`.slice(this.prefixLength * -1);
        this.ws = ws;
        this.onMessageListener = this._onMessageListener.bind(this);
        this.ws.addEventListener("message", this.onMessageListener);
    }

    close() {
        this.ws.removeEventListener("message", this._onMessageListener);
    }

    send(data: any) {
        if (typeof(data) !== "string") {
            throw new Error(`MultiplexWebSocket only support sending string, passed a type ${typeof(data)}`);
        }
        super.send(this.channel + data);
    }

    private _onMessageListener(e: MessageEvent): any {
        if (typeof( e.data) === "string" && this.channel === e.data.substr(0, this.prefixLength)) {
            this.dispatchEvent(new MessageEvent("message", {
                data: e.data.substr(this.prefixLength - 1),
                origin: e.origin,
                ports: e.ports,
                source: e.source,
            }));
            return false;
        }
    }
}
