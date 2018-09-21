/* tslint:disable:no-unused-expression max-classes-per-file */

import WebSocket from "../polyfill/WebSocket";

import { expect } from "chai";
import { IRouterConnector } from "./IRouterConnector";
import { Router } from "./Router";

export class DummyRouterConnector implements IRouterConnector {

    public static clear = () => DummyRouterConnector.instances.length = 0;
    private static instances: DummyRouterConnector[] = [];
    public onMessage?: (key: string, data: any) => boolean;
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
    public readyState: number = WebSocket.OPEN;

    public send(data: any) {
        this.received.push(data);
    }
    public close(code?: number, reason?: string) {
        this.closed = { code, reason };
        this.readyState = WebSocket.CLOSED;
    }
}

const MockWebsocket = MockWebsocketClass as any;  // tslint:disable-line:variable-name

describe("Router", () => {
    describe("set", () => {
        it("should add the Websocket",  () => {
            const router = new Router();
            const ws1 = new MockWebsocket();
            router.set("id", ws1);
            expect(router.get("id")).to.equal(ws1);
        });
        it("should replace the Websocket and close the olv one",  () => {
            const router = new Router();
            const ws1 = new MockWebsocket();
            const ws2 = new MockWebsocket();
            router.set("id", ws1);
            router.set("id", ws2);
            expect(router.get("id")).to.equal(ws2);
            expect(ws1.closed).to.not.be.undefined;
        });
        it("should add 2 Websocket",  () => {
            const router = new Router();
            const ws1 = new MockWebsocket();
            const ws2 = new MockWebsocket();
            router.set("id1", ws1);
            router.set("id2", ws2);
            expect(router.get("id1")).to.equal(ws1);
            expect(router.get("id2")).to.equal(ws2);
        });
        it("should overwrite the Websocket", () => {
            const router = new Router();
            const ws1 = new MockWebsocket();
            router.set("id", ws1);
            const ws2 = new MockWebsocket();
            router.set("id", ws2);
            expect(router.get("id")).to.equal(ws2);
        });
    });
    describe("delete", () => {
        it("should remove the Websocket", () => {
            const router = new Router();
            const ws1 = new MockWebsocket();
            router.set("id", ws1);
            router.delete("id");
            expect(router.get("id")).to.not.equal(ws1);
        });
    });
    describe("clear", () => {
        it("should remove the Websocket", () => {
            const router = new Router();
            const ws1 = new MockWebsocket();
            router.set("id", ws1);
            router.clear();
            expect(router.get("id")).to.not.equal(ws1);
        });
    });

    describe("get", () => {
        it("should return the websocket for a connected websocket", () => {
            const router = new Router();
            const ws1 = new MockWebsocket();
            router.set("id", ws1);
            expect(router.get("id")).to.equal(ws1);
        });

    });

    describe("send", () => {
        it("should send to the correct ws",  () => {
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
            ws1 = new MockWebsocket();
            ws2 = new MockWebsocket();
            router1.set("id1", ws1);
            router2.set("id2", ws2);
        });
        afterEach(() => {
            DummyRouterConnector.clear();
        });
        it("should broadcast", () => {
            router1.broadcast("test");
            expect(ws1.received.length).to.equal(1);
            expect(ws2.received.length).to.equal(1);
        });
        it("should broadcast to open only", () => {
            ws2.close();
            router1.broadcast("test");
            expect(ws1.received.length).to.equal(1);
            expect(ws2.received.length).to.equal(0);
        });
        it("should transmit messages to a remote websocket", () => {
            router1.get("id2").send("test");
            expect(ws1.received.length).to.equal(0);
            expect(ws2.received.length).to.equal(1);
        });
        it("should transmit messages to a remote if open only", () => {
            ws2.close();
            router1.get("id2").send("test");
            expect(ws1.received.length).to.equal(0);
            expect(ws2.received.length).to.equal(0);
        });
        it("should get twice the same remote websocket", () => {
            router1.get("id2").send("test");
            router1.get("id2").send("test");
            expect(ws1.received.length).to.equal(0);
            expect(ws2.received.length).to.equal(2);
        });
        it("should close a remote websocket", () => {
            router1.get("id2").close(999, "test");
            expect(ws2.closed).to.deep.equal({ code: 999, reason: "test" });
        });
        it("should replace a remote websocket", () => {
            const ws3 = new MockWebsocket();
            router1.set("id2", ws3);
            expect(ws2.closed).to.not.be.undefined;
        });
        it("should replace a connector", () => {
            const connector3 = new DummyRouterConnector();
            router1.connector = connector3;
            router1.get("id2").send("test");
            expect(ws1.received.length).to.equal(0);
            expect(ws2.received.length).to.equal(1);
        });
        it("should delete a connector", () => {
            router1.connector = null;
            router1.get("id2").send("test");
            expect(ws1.received.length).to.equal(0);
            expect(ws2.received.length).to.equal(0);
        });
    });
});
