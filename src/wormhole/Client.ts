import { Cable } from "../cable/Cable";
import { Pipe } from "../pipe/Pipe";
import { Dict } from "../polyfill/Dict";
import ErrorEvent from "../polyfill/ErrorEvent";
import { Tank } from "../tank/Tank";

export class Client {

    public readonly dataPipe: WebSocket;
    public readonly cable: Cable;
    private readonly webSockets: Dict<string, Pipe> = new Dict();
    private identified = false;
    private identifyRunning = false;

    constructor(private readonly uuid: string, ws: WebSocket, onConnection: (ws: WebSocket) => void) {
        const cablePipe = new Pipe(ws, "WOHC");
        this.dataPipe = new Pipe(ws, "WOHD");
        this.cable = new Cable(new Tank(cablePipe));

        this.cable.register("open", ({ channel }: { channel: string }): Promise<void> => {
            if (this.webSockets.has(channel)) {
                return new Promise((resolve) => setTimeout(resolve, 0));
            }

            const pipe = new Pipe(this.dataPipe, channel, 32);
            this.webSockets.set(channel, pipe);
            onConnection(pipe);
            return new Promise((resolve) => setTimeout(resolve, 0));
        });
        this.cable.register("close", ({ channel }: { channel: string }): Promise<void> => {
            if (this.webSockets.has(channel)) {
                this.webSockets.get(channel).close();
                this.webSockets.delete(channel);
            }
            return new Promise((resolve) => setTimeout(resolve, 0));
        });
        if (ws.readyState === WebSocket.OPEN) {
            this.identify();
        }
        ws.addEventListener("open", () => {
            this.identified = false;
            this.identifyRunning = false;
            this.identify();
        });

    }

    public connect(uuid): WebSocket {
        const channel = (Math.random().toString().replace(".", "") +
            Math.random().toString().replace(".", "")).slice(0, 32);
        const pipe = new Pipe(this.dataPipe, channel, 32);
        this.cable.request("connect", { uuid, channel }).catch((e) => pipe.dispatchEvent(new ErrorEvent(e)));
        pipe.addEventListener("close", () => {
            try {
                this.cable.notify("close", { channel });
            } catch (e) {
                // ignore
            }
        });
        return pipe;
    }

    private identify() {
        if (this.identified || this.identifyRunning) {
            return;
        }
        this.identifyRunning = true;
        this.cable.request("identity", { uuid: this.uuid })
            .then(() => {
                this.identifyRunning = false;
                this.identified = true;
            })
            .catch(() => {
                this.identifyRunning = false;
                setTimeout(() => {
                    this.identify();
                }, 100);
            });
    }

}
