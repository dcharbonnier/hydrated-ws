import { Cable } from "../cable/Cable";
import { Pipe } from "../pipe/Pipe";
import { Dict } from "../polyfill/Dict";
import { Tank } from "../tank/Tank";

export class Client {
    public webSockets: Dict<string, Pipe>;

    public readonly dataPipe: WebSocket;
    public readonly cable: Cable;

    constructor(private readonly uuid: string, ws: WebSocket, onConnection: (ws: WebSocket) => void) {
        const cablePipe = new Pipe(ws, "WOHC");
        this.dataPipe = new Pipe(ws, "WOHD");

        this.cable = new Cable(new Tank(cablePipe));

        this.cable.request("identity", { uuid })
            .catch((e) => console.log("identity failed", e));

        this.cable.register("open", ({ channel }: { channel: string }): Promise<void> => {
            const pipe = new Pipe(this.dataPipe, channel, 32);
            // this.webSockets.set(channel, pipe);
            onConnection(pipe);
            return new Promise((resolve) => setTimeout(resolve, 0));
        });
        this.cable.register("close", ({ channel }: { channel: string }): Promise<void> => {
            // if (this.webSockets.has(channel)) {
            //     this.webSockets.get(channel).close();
            //     this.webSockets.delete(channel);
            // }
            return new Promise((resolve) => setTimeout(resolve, 0));
        });
    }

    public connect(uuid): WebSocket {
        const channel = (Math.random().toString().replace(".", "") +
            Math.random().toString().replace(".", "")).slice(0, 32);
        this.cable.request("connect", { uuid, channel }).catch((e) => console.log("connect failed", e));
        return new Pipe(this.dataPipe, channel, 32);
    }

}
