import {Cable} from "../cable/Cable";
import {Pipe} from "../pipe/Pipe";
import {Dict} from "../polyfill/Dict";
import WebSocket from "../polyfill/WebSocket";
import {Router} from "../router/Router";

export class Server {

    public readonly router: Router;

    public clients: Dict<string, { data: Pipe, cable: Pipe }> = new Dict();
    public buffers: Dict<string, string[]> = new Dict();
    public channels: Dict<string, { source: Pipe, target?: Pipe }> = new Dict();

    constructor() {
        this.router = new Router();
    }

    public destroy() {
        this.router.destroy();
        this.channels.values()
            .forEach(({source, target}: { source: Pipe, target?: Pipe }) => {
                if (source) {
                    source.close();
                }
                if (target) {
                    target.close();
                }
            });
        this.clients.values()
            .forEach(({data, cable}: { data: Pipe, cable?: Pipe }) => {
                if (data) {
                    data.close();
                }
                if (cable) {
                    cable.close();
                }
            });
        this.clients = void 0;
        this.buffers = void 0;
        this.channels = void 0;
    }

    public addWebSocket(ws: WebSocket): () => void {

        const cablePipe = new Pipe(ws, "WOHC");
        const cable = new Cable(cablePipe);
        const dataPipe = new Pipe(ws, "WOHD");

        cable.register("identity", ({uuid}: { uuid: string }): Promise<void> => {
            this.router.set(uuid, ws);
            return new Promise((resolve) => setTimeout(resolve, 0));
        });

        cable.register("close", ({channel}: { channel: string }): Promise<void> => {
            const pipes = this.channels.get(channel);
            if (pipes && pipes.source) {
                pipes.source.close();
            }
            return new Promise((resolve) => setTimeout(resolve, 0));
        });

        cable.register("connect", ({uuid, channel}: { uuid: string, channel: string }): Promise<void> => {
            try {
                const targetWs = this.router.get(uuid);
                const pipes: { source: Pipe, target?: Pipe } = {source: new Pipe(dataPipe, channel, 32)};
                this.channels.set(channel, pipes);
                pipes.source.onmessage = (event) => {
                    if (!this.buffers.has(channel)) {
                        this.buffers.set(channel, []);
                    }
                    this.buffers.get(channel).push(event.data);
                };
                const connect = () => {
                    if (!this.clients.has(uuid)) {
                        const routedCablePipe = new Pipe(targetWs, "WOHC");
                        const routedDataPipe = new Pipe(targetWs, "WOHD");
                        this.clients.set(uuid, { data: routedDataPipe, cable: routedCablePipe });
                    }
                    const client = this.clients.get(uuid);
                    const targetCablePipe = client.cable;
                    const targetDataPipe = client.data;
                    const targetCable = new Cable(targetCablePipe);
                    pipes.target = new Pipe(targetDataPipe, channel, 32);
                    pipes.target.onmessage = (event) => {
                        try {
                            pipes.source.send(event.data);
                        } catch (e) {
                            // ignore
                        }
                    };
                    pipes.source.onclose = (event) => {
                        pipes.target.close();
                        try {
                            targetCable.notify("close", {channel});
                        } catch (e) {
                            // ignore
                        }
                        this.channels.delete(channel);
                    };
                    targetCable.request("open", {channel})
                        .then(() => {
                            const buffer = this.buffers.get(channel) || [];
                            while (buffer.length) {
                                pipes.target.send(buffer.shift());
                            }
                            pipes.source.onmessage = (event) => {
                                pipes.target.send(event.data);
                            };
                        })
                        .catch(() => void 0);

                };
                if (targetWs.readyState === WebSocket.OPEN) {
                    connect();
                }
                targetWs.addEventListener("open", () => {
                    connect();
                });
            } catch (e) {
                // ignore
            }
            return new Promise((resolve) => setTimeout(resolve, 0));
        });

        return () => {
            cable.destroy();
            cablePipe.close();
            dataPipe.close();
        };
    }

}
