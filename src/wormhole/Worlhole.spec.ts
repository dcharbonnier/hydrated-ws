
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
        mockServer.close(() => done());
    });

    it("client should register a new connection with an id", (done) => {
        const server = new wormhole.Server();
        mockServer.on("connection", (clientWs) => {
            server.addWebSocket(clientWs);
        });
        const client1 = new wormhole.Client("client1", new WebSocket(url), () => void 0);
        client1.dataPipe.onmessage = (evt) => {
            expect(evt.data).to.equal("test");
            done();
        };
        const ws = new Pipe(server.router.get("client1"), "WOHD");
        ws.onopen = () => ws.send("test");

    });

    it("addWebSocket return a destructor", (done) => {
        const server = new wormhole.Server();
        mockServer.on("connection", (clientWs) => {
            const destructor = server.addWebSocket(clientWs);
            destructor();
            done();
        });
        const client1 = new wormhole.Client("client1", new WebSocket(url), () => void 0);
        // client1.dataPipe.onmessage = (evt) => {
        //     expect(evt.data).to.equal("test");
        //     done();
        // };
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
            ws.onmessage = (event) => ws.send(`hello ${event.data}`);
        });

        const ws1 = new Tank(client1.connect("client2"));
        ws1.onmessage = (event) => {
            expect(event.data).to.equal("hello client 1");
            done();
        };
        ws1.send("client 1");
    });

    it("destroy the server", () => {
        const server = new wormhole.Server();
        server.destroy();
    });

    it("close a direct connection between clients", (done) => {
        const server = new wormhole.Server();
        mockServer.on("connection", (ws) => {
            server.addWebSocket(ws);
        });

        const client1 = new wormhole.Client("client1", new WebSocket(url), () => void 0);
        const client2 = new wormhole.Client("client2", new WebSocket(url), (ws: WebSocket) => {
            ws.onclose = () => done();
        });

        const ws1 = client1.connect("client2");
        ws1.close();
    });
    it("build a direct connection between clients even if the client get connected later", (done) => {
        const server = new wormhole.Server();
        mockServer.on("connection", (ws) => {
            server.addWebSocket(ws);
        });

        const client1 = new wormhole.Client("client1", new WebSocket(url), () => void 0);

        const ws1 = new Tank(client1.connect("client2"));
        ws1.onmessage = (event) => {
            expect(event.data).to.equal("hello client 1");
            done();
        };
        ws1.send("client 1");
        setTimeout(() => {
            const client2 = new wormhole.Client("client2", new WebSocket(url), (ws: WebSocket) => {
                ws.onmessage = (event) => ws.send(`hello ${event.data}`);
            });
        }, 100);
    });
    it("build a direct connection between clients when the client reconnect", (done) => {
        const server = new wormhole.Server();
        mockServer.on("connection", (ws) => {
            server.addWebSocket(ws);
        });
        const client1 = new wormhole.Client("client1", new WebSocket(url), () => void 0);
        const client2 = new wormhole.Client("client2", new WebSocket(url), (ws: WebSocket) => void 0);
        const ws1 = new Tank(client1.connect("client2"));
        ws1.onmessage = (event) => {
            expect(event.data).to.equal("hello client 1");
            done();
        };
        const client2bis = new wormhole.Client("client2", new WebSocket(url), (ws: WebSocket) => {
            ws.onmessage = (event) => ws.send(`hello ${event.data}`);
        });

        setTimeout(() => {
            ws1.send("client 1");
        }, 100);
    });
});
