import { Cable } from "../cable/Cable";
import { Pipe } from "../pipe/Pipe";
import { Dict } from "../polyfill/Dict";
import WebSocket from "../polyfill/WebSocket";
import { Router } from "../router/Router";
import { Tank } from "../tank/Tank";

export class Server {

    public readonly router: Router;

    public pipes: Dict<string, { data: Pipe, cable: Pipe }> = new Dict();
    public buffer: Dict<string, string[]> = new Dict();

    constructor() {
        this.router = new Router();
    }

    public addWebSocket(ws: WebSocket) {

        const cablePipe = new Pipe(ws, "WOHC");
        const cable = new Cable(cablePipe);
        const dataPipe = new Pipe(ws, "WOHD");
        dataPipe.addEventListener("message", (e) => {
            const channel = e.data.substr(0, 32);
            if (!this.buffer.has(channel)) {
                this.buffer.set(channel, []);
            }
            this.buffer.get(channel).push(e.data.substr(32));
        });

        cable.register("identity", ({ uuid }: { uuid: string }): Promise<void> => {
            this.pipes.set(uuid, {data: dataPipe, cable: cablePipe});
            this.router.set(uuid, ws);
            return new Promise((resolve) => setTimeout(resolve, 0));
        });

        cable.register("connect", ({ uuid, channel }: { uuid: string, channel: string }): Promise<void> => {
            const targetWs = this.router.get(uuid);
            const connect = () => {
                const pipes = this.pipes.get(uuid);
                const targetCablePipe = pipes.cable;
                const targetDataPipe = pipes.data;
                const targetCable = new Cable(targetCablePipe);
                const targetPipe = new Tank(new Pipe(targetDataPipe, channel, 32));
                const sourcePipe = new Tank(new Pipe(dataPipe, channel, 32));

                targetPipe.onmessage = (event) => {
                    sourcePipe.send(event.data);
                };
                sourcePipe.onmessage = (event) => {
                    targetPipe.send(event.data || event);
                };

                targetCable.request("open", { channel }).catch((e) => console.log("open failed", e));
                const buffer = this.buffer.get(channel) || [];
                while (buffer.length) {
                    targetPipe.send(buffer.shift());
                }

            };
            if (targetWs.readyState === WebSocket.OPEN) {
                connect();
            } else {
                targetWs.addEventListener("open", () => {
                    targetWs.removeEventListener("open", connect);
                    connect();
                });
            }

            return new Promise((resolve) => setTimeout(resolve, 0));
        });
    }

}
