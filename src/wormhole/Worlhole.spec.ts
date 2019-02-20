import {expect} from "chai";

import {Pipe} from "../pipe/Pipe";
import isNode from "../polyfill/isNode";
import WebSocket from "../polyfill/WebSocket";
import {Tank} from "../tank/Tank";
import * as wormhole from "./index";
import {DummyRouterConnector} from "../router/DummyRouterConnector";

describe("Wormhole", () => {
    if (!isNode || !(WebSocket as any).Server) {
        return;
    }

    const urls = [`ws://localhost:5478`, `ws://localhost:5479`];
    let mockServers: any[] = [];
    beforeEach(() => {
        mockServers[0] = new (WebSocket as any).Server({
            port: 5478,
        });
        mockServers[1] = new (WebSocket as any).Server({
            port: 5479,
        });
    });
    afterEach((done) => {
        let i = 0;
        const checkDone = () => {
            i++;
            if (i === mockServers.length) {
                done();
            }
        };
        mockServers.map(mockServer => mockServer.close(checkDone));
    });

    it("client should register a new connection with an id", (done) => {
        const server = new wormhole.Server();
        mockServers[0].on("connection", (clientWs) => {
            server.addWebSocket(clientWs);
        });
        const client1 = new wormhole.Client("client1", new WebSocket(urls[0]), () => void 0);
        client1.dataPipe.onmessage = (evt) => {
            expect(evt.data).to.equal("test");
            done();
        };
        const ws = new Pipe(server.router.get("client1"), "WOHD");
        ws.onopen = () => ws.send("test");

    });

    it("addWebSocket return a destructor", (done) => {
        const server = new wormhole.Server();
        mockServers[0].on("connection", (clientWs) => {
            const destructor = server.addWebSocket(clientWs);
            destructor();
            done();
        });
        const client1 = new wormhole.Client("client1", new WebSocket(urls[0]), () => void 0);
        // client1.dataPipe.onmessage = (evt) => {
        //     expect(evt.data).to.equal("test");
        //     done();
        // };
        const ws = new Pipe(server.router.get("client1"), "WOHD");
        ws.onopen = () => ws.send("test");

    });

    it("build a direct connection between clients", (done) => {
        const server = new wormhole.Server();
        mockServers[0].on("connection", (ws) => {
            server.addWebSocket(ws);
        });

        const client1 = new wormhole.Client("client1", new WebSocket(urls[0]), () => void 0);
        const client2 = new wormhole.Client("client2", new WebSocket(urls[0]), (ws: WebSocket) => {
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
        mockServers[0].on("connection", (ws) => {
            server.addWebSocket(ws);
        });

        const client1 = new wormhole.Client("client1", new WebSocket(urls[0]), () => void 0);
        const client2 = new wormhole.Client("client2", new WebSocket(urls[0]), (ws: WebSocket) => {
            ws.onclose = () => done();
        });

        const ws1 = client1.connect("client2");
        ws1.close();
    });
    it("build a direct connection between clients even if the client get connected later", (done) => {
        const server = new wormhole.Server();
        mockServers[0].on("connection", (ws) => {
            server.addWebSocket(ws);
        });

        const client1 = new wormhole.Client("client1", new WebSocket(urls[0]), () => void 0);

        const ws1 = new Tank(client1.connect("client2"));
        ws1.onmessage = (event) => {
            expect(event.data).to.equal("hello client 1");
            done();
        };
        ws1.send("client 1");
        setTimeout(() => {
            const client2 = new wormhole.Client("client2", new WebSocket(urls[0]), (ws: WebSocket) => {
                ws.onmessage = (event) => ws.send(`hello ${event.data}`);
            });
        }, 100);
    });
    it("build a direct connection between clients when the client reconnect", (done) => {
        const server = new wormhole.Server();
        mockServers[0].on("connection", (ws) => {
            server.addWebSocket(ws);
        });
        const client1 = new wormhole.Client("client1", new WebSocket(urls[0]), () => void 0);
        const client2 = new wormhole.Client("client2", new WebSocket(urls[0]), (ws: WebSocket) => void 0);
        const ws1 = new Tank(client1.connect("client2"));
        ws1.onmessage = (event) => {
            expect(event.data).to.equal("hello client 1");
            done();
        };
        const client2bis = new wormhole.Client("client2", new WebSocket(urls[0]), (ws: WebSocket) => {
            ws.onmessage = (event) => ws.send(`hello ${event.data}`);
        });

        setTimeout(() => {
            ws1.send("client 1");
        }, 100);
    });


    it("build a direct connection between clients on different servers", (done) => {
        const server1 = new wormhole.Server();
        const server2 = new wormhole.Server();
        const connector1 = new DummyRouterConnector();
        const connector2 = new DummyRouterConnector();
        server1.router.connector = connector1;
        server2.router.connector = connector2;
        mockServers[0].on("connection", (ws) => {
            server1.addWebSocket(ws);
        });
        mockServers[1].on("connection", (ws) => {
            server2.addWebSocket(ws);
        });

        const client1 = new wormhole.Client("client1", new WebSocket(urls[0]), () => void 0);
        const client2 = new wormhole.Client("client2", new WebSocket(urls[1]), (ws: WebSocket) => {
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
    });


    it("keep the wormhole working when the client reconnect to a different server 1", (done) => {
        const server1 = new wormhole.Server();
        const server2 = new wormhole.Server();
        const connector1 = new DummyRouterConnector();
        const connector2 = new DummyRouterConnector();
        server1.router.connector = connector1;
        server2.router.connector = connector2;
        mockServers[0].on("connection", (ws) => {
            server1.addWebSocket(ws);
        });
        mockServers[1].on("connection", (ws) => {
            server2.addWebSocket(ws);
        });

        const ws=new WebSocket(urls[1]);
        new wormhole.Client("client1", ws, () => void 0);

        setTimeout(() => {
            ws.close();
            const client1 = new wormhole.Client("client1", new WebSocket(urls[0]), () => void 0);
            const client2 = new wormhole.Client("client2", new WebSocket(urls[1]), (ws: WebSocket) => {
                ws.onmessage = (event) => {
                    ws.send(`hello ${event.data}`);
                };
            });
            setTimeout(() => {
                const ws1 = new Tank(client1.connect("client2"));
                ws1.onmessage = (event) => {
                    expect(event.data).to.equal("hello client 1");
                    done();
                };
                ws1.send("client 1");
            }, 500);

        }, 100);

    });

    it("keep the wormhole working when the client reconnect to a different server 2", (done) => {
        const server1 = new wormhole.Server();
        const server2 = new wormhole.Server();
        const connector1 = new DummyRouterConnector();
        const connector2 = new DummyRouterConnector();
        server1.router.connector = connector1;
        server2.router.connector = connector2;
        mockServers[0].on("connection", (ws) => {
            server1.addWebSocket(ws);
        });
        mockServers[1].on("connection", (ws) => {
            server2.addWebSocket(ws);
        });

        const ws=new WebSocket(urls[0]);
        new wormhole.Client("client1", ws, () => void 0);

        setTimeout(() => {
            ws.close();
            const client1 = new wormhole.Client("client1", new WebSocket(urls[1]), () => void 0);
            const client2 = new wormhole.Client("client2", new WebSocket(urls[1]), (ws: WebSocket) => {
                ws.onmessage = (event) => {
                    ws.send(`hello ${event.data}`);
                };
            });
            setTimeout(() => {
                const ws1 = new Tank(client1.connect("client2"));
                ws1.onmessage = (event) => {
                    expect(event.data).to.equal("hello client 1");
                    done();
                };
                ws1.send("client 1");
            }, 500);

        }, 100);

    });
    it("keep the wormhole working when the client reconnect to a different server 3", (done) => {
        const server1 = new wormhole.Server();
        const server2 = new wormhole.Server();
        const connector1 = new DummyRouterConnector();
        const connector2 = new DummyRouterConnector();
        server1.router.connector = connector1;
        server2.router.connector = connector2;
        mockServers[0].on("connection", (ws) => {
            server1.addWebSocket(ws);
        });
        mockServers[1].on("connection", (ws) => {
            server2.addWebSocket(ws);
        });

        const ws=new WebSocket(urls[1]);
        new wormhole.Client("client2", ws, () => void 0);

        setTimeout(() => {
            ws.close();
            const client1 = new wormhole.Client("client1", new WebSocket(urls[1]), () => void 0);
            const client2 = new wormhole.Client("client2", new WebSocket(urls[0]), (ws: WebSocket) => {
                ws.onmessage = (event) => {
                    ws.send(`hello ${event.data}`);
                };
            });
            setTimeout(() => {
                const ws1 = new Tank(client1.connect("client2"));
                ws1.onmessage = (event) => {
                    expect(event.data).to.equal("hello client 1");
                    done();
                };
                ws1.send("client 1");
            }, 500);

        }, 100);
    });
});
