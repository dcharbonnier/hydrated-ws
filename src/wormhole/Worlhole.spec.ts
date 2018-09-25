
import { expect } from "chai";

import { Pipe } from "../pipe/Pipe";
import isNode from "../polyfill/isNode";
import WebSocket from "../polyfill/WebSocket";
import { Tank } from "../tank/Tank";
import * as wormhole from "./index";

describe("Wormhole", () => {
    if (!isNode || !(WebSocket as any).Server) {
        return;
    }

    const url = `ws://localhost:5478`;
    let mockServer: any;
    beforeEach(() => {
        mockServer = new (WebSocket as any).Server({
            port: 5478,
        });
    });
    afterEach((done) => {
        mockServer.close(done);
    });
    it("client should register a new connection with an id", (done) => {

        const server = new wormhole.Server();
        mockServer.on("connection", (ws) => {
            server.addWebSocket(ws);
        });
        const client1 = new wormhole.Client("client1", new WebSocket(url), () => void 0);
        client1.dataPipe.onmessage = (evt) => {
            expect(evt.data).to.equal("test");
            done();
        };

        const ws = new Pipe(server.router.get("client1"), "WOHD");
        ws.onopen = () => ws.send("test");

    });
    it("build a direct connection between clients", (done) => {
        const server = new wormhole.Server();
        mockServer.on("connection", (ws) => {
            server.addWebSocket(ws);
        });

        const client1 = new wormhole.Client("client1", new WebSocket(url), () => void 0);
        const client2 = new wormhole.Client("client2", new WebSocket(url), (ws: WebSocket) => {
            ws.onmessage = (event) => {
                ws.send(`hello ${event.data}`);
            };
        });

        const ws1 = new Tank(client1.connect("client2"));
        ws1.onmessage = (event) => {
            expect(event.data).to.equal("hello client 1");
            done();
        };
        ws1.send("client 1");

        //
    });
    // Make sure the worms are re-established on reconnect
    // Make sure the worms are re-established on reconnect
    // Keep the messages for when it's disconnected, like a tank
});
