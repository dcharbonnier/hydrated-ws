/* tslint:disable:no-unused-expression max-classes-per-file */

import WebSocket from "../polyfill/WebSocket";

import { expect } from "chai";
import { IRouterConnector } from "./IRouterConnector";
import { Router } from "./Router";

export class DummyRouterConnector implements IRouterConnector {

    public static clear = () => DummyRouterConnector.instances.length = 0;
    private static instances: DummyRouterConnector[] = [];
    public onMessage?: (key: string, data: any) => boolean;
    public onStatus?: (key: string, status: number) => boolean;
    public onBroadcast?: (data: any) => void;
    public onClose?: (key: string, code: number, reason: string) => boolean;

    constructor() {
        DummyRouterConnector.instances.push(this);
    }

    public send(key: string, data: any): void {
        for (const connector of DummyRouterConnector.instances) {
            if (connector !== this && connector.onMessage && connector.onMessage(key, data)) {
                return;
            }
        }
    }

    public broadcast(data: any): void {
        DummyRouterConnector.instances.forEach((connector) => {
            if (connector !== this && connector.onBroadcast) {
                connector.onBroadcast(data);
            }
        });
    }

    public status(key: string, status: number): void {
        DummyRouterConnector.instances.forEach((connector) => {
            if (connector !== this && connector.onStatus) {
                connector.onStatus(key, status);
            }
        });
    }

    public close(key: string, code: number, reason: string): void {
        for (const connector of DummyRouterConnector.instances) {
            if (connector !== this && connector.onClose && connector.onClose(key, code, reason)) {
                return;
            }
        }
    }
}

class MockWebsocketClass {
    public received: any[] = [];
    public closed: { code: number, reason: string } = void 0;

    public listeners: { open: any[], close: any[] } = { open: [], close: [] };

    constructor(public readyState: number = WebSocket.OPEN) {
        setTimeout(() => {
            if (this.readyState === WebSocket.OPEN) {
                return;
            }
            this.readyState = WebSocket.OPEN;
            this.listeners.open.forEach(((clb) => clb()));
        });
    }
    public send(data: any) {
        this.received.push(data);
    }
    public close(code?: number, reason?: string) {
        this.closed = { code, reason };
        this.readyState = WebSocket.CLOSED;
        setTimeout(() => this.listeners.close.forEach(((clb) => clb())));

    }

    public addEventListener(event: "open" | "close", callback: (e: any) => void) {
        this.listeners[event].push(callback);
    }
}

const MockWebsocket = MockWebsocketClass as any;  // tslint:disable-line:variable-name

describe.only("Router", () => {
    describe("set", () => {
        it("should add the Websocket", () => {
            const router = new Router();
            const ws1 = new MockWebsocket();
            router.set("id", ws1);
        });
        it("should replace the Websocket and close the old one", () => {
            const router = new Router();
            const ws1 = new MockWebsocket();
            const ws2 = new MockWebsocket();
            router.set("id", ws1);
            router.set("id", ws2);
            expect(ws1.closed).to.not.be.undefined;
        });
        it("should overwrite the Websocket", () => {
            const router = new Router();
            const ws1 = new MockWebsocket();
            router.set("id", ws1);
            const ws2 = new MockWebsocket();
            router.set("id", ws2);
            router.get("id").send("test");
            expect(ws1.received.length).to.equal(0);
            expect(ws2.received.length).to.equal(1);
        });
    });
    describe("delete", () => {
        it("should remove the Websocket", () => {
            const router = new Router();
            const ws1 = new MockWebsocket();
            router.set("id", ws1);
            const ws = router.get("id");
            router.delete("id");
            expect(ws.readyState).to.equal(WebSocket.CLOSED);
        });
    });
    describe("clear", () => {
        it("should remove the Websocket", () => {
            const router = new Router();
            const ws1 = new MockWebsocket();
            router.set("id", ws1);
            const ws = router.get("id");
            router.clear();
            expect(ws.readyState).to.equal(WebSocket.CLOSED);
        });
    });

    describe("send", () => {
        it("should send to the correct ws", () => {
            const router = new Router();
            const ws1 = new MockWebsocket();
            const ws2 = new MockWebsocket();
            router.set("id1", ws1);
            router.set("id2", ws2);
            router.get("id1").send("test");
            expect(ws1.received.length).to.equal(1);
            expect(ws2.received.length).to.equal(0);
        });

    });

    describe("broadcast", () => {
        it("should broadcast to all the connected ws", () => {
            const router = new Router();
            const ws1 = new MockWebsocket();
            const ws2 = new MockWebsocket();
            const ws3 = new MockWebsocket();
            router.set("id1", ws1);
            router.set("id2", ws2);
            router.set("id3", ws3);
            ws3.close();
            router.broadcast("test");
            expect(ws1.received.length).to.equal(1);
            expect(ws2.received.length).to.equal(1);
            expect(ws3.received.length).to.equal(0);
        });
        it("should only broadcast if the ws are connected", () => {
            const router = new Router();
            const ws1 = new MockWebsocket();
            const ws2 = new MockWebsocket();
            router.set("id1", ws1);
            router.set("id2", ws2);
            ws1.readyState = WebSocket.CLOSING;
            router.broadcast("test");
            expect(ws1.received.length).to.equal(0);
            expect(ws2.received.length).to.equal(1);
        });
    });

    describe("connector", () => {
        let router1: Router;
        let router2: Router;
        let ws1: any;
        let ws2: any;
        beforeEach(() => {
            const connector1 = new DummyRouterConnector();
            const connector2 = new DummyRouterConnector();
            router1 = new Router();
            router1.connector = connector1;
            router2 = new Router();
            router2.connector = connector2;
            ws1 = new MockWebsocket(WebSocket.CONNECTING);
            ws2 = new MockWebsocket(WebSocket.CONNECTING);
            router1.set("id1", ws1);
            router2.set("id2", ws2);
        });
        afterEach(() => {
            DummyRouterConnector.clear();
        });
        it("should broadcast", (done) => {
            setTimeout(() => {
                router1.broadcast("test");
                expect(ws1.received.length).to.equal(1);
                expect(ws2.received.length).to.equal(1);
                done();
            });
        });
        it("should broadcast to open only", (done) => {
            setTimeout(() => {
                ws2.close();
                router1.broadcast("test");
                expect(ws1.received.length).to.equal(1);
                expect(ws2.received.length).to.equal(0);
                done();
            });
        });
        it("should transmit messages to a remote websocket", (done) => {
            setTimeout(() => {
                router1.get("id2").send("test");
                expect(ws1.received.length).to.equal(0);
                expect(ws2.received.length).to.equal(1);
                done();
            });
        });
        it("should transmit messages to a remote if open only", (done) => {
            setTimeout(() => {
                ws2.close();
                router1.get("id2").send("test");
                expect(ws1.received.length).to.equal(0);
                expect(ws2.received.length).to.equal(0);
                done();
            });
        });
        it("should get twice the same remote websocket", (done) => {
            setTimeout(() => {
                router1.get("id2").send("test");
                router1.get("id2").send("test");
                expect(ws1.received.length).to.equal(0);
                expect(ws2.received.length).to.equal(2);
                done();
            });
        });
        it("should close a remote websocket", (done) => {
            setTimeout(() => {
                router1.get("id2").close(999, "test");
                expect(ws2.closed).to.deep.equal({ code: 999, reason: "test" });
                done();
            });
        });
        it("should replace a remote websocket", (done) => {
            setTimeout(() => {
                const ws3 = new MockWebsocket();
                router1.set("id2", ws3);
                expect(ws2.closed).to.not.be.undefined;
                done();
            });
        });
        it("should replace a connector", (done) => {
            setTimeout(() => {
                const connector3 = new DummyRouterConnector();
                router1.connector = connector3;
                router1.get("id2").send("test");
                expect(ws1.received.length).to.equal(0);
                expect(ws2.received.length).to.equal(1);
                done();
            });
        });
        it("should delete a connector", (done) => {
            setTimeout(() => {
                router1.connector = null;
                router1.get("id2").send("test");
                expect(ws1.received.length).to.equal(0);
                expect(ws2.received.length).to.equal(0);
                done();
            });
        });
    });
});
