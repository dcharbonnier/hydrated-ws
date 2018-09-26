
import { expect } from "chai";

import { Cable } from "../cable/Cable";
import { Pipe } from "../pipe/Pipe";
import isNode from "../polyfill/isNode";
import WebSocket from "../polyfill/WebSocket";
import { Tank } from "../tank/Tank";
import * as wormhole from "./index";

describe("Wormhole client", () => {
    if (!isNode || !(WebSocket as any).Server) {
        return;
    }

    const url = `ws://localhost:5478`;
    let mockServer: any;
    let ws: WebSocket;
    let client: wormhole.Client;
    let clientsWs: WebSocket[];
    beforeEach((done) => {
        mockServer = new (WebSocket as any).Server({
            port: 5478,
        });
        clientsWs = [];
        client = new wormhole.Client("client1", new WebSocket(url), () => {
            clientsWs.push(ws);
        });
        mockServer.on("connection", (webSocket) => {
            ws = webSocket;
            done();
        });
    });
    afterEach((done) => {
        mockServer.close(() => done());
    });

    it("client should identify on connect", (done) => {
        const cable = new Cable(new Pipe(ws, "WOHC"));
        cable.register("identity", (data): Promise<void> => {
            expect(data).to.deep.equal({ uuid: "client1" });
            done();
            return new Promise((resolve) => setTimeout(resolve, 0));
        });
    });

    it("client should retry if the identity fail", (done) => {
        const cable = new Cable(new Pipe(ws, "WOHC"));
        let count: number = 0;
        cable.register("identity", (data): Promise<void> => {
            if (count === 1) {
                done();
                return new Promise((resolve, reject) => setTimeout(resolve(), 0));
            }
            count++;
            return new Promise((resolve, reject) => setTimeout(reject(new Error("fail")), 0));
        });

    });

    it("calling twice open should only return one socket", (done) => {
        const cable = new Cable(new Pipe(ws, "WOHC"));
        cable.request("open", {channel: "test"});
        cable.request("open", {channel: "test"});
        setTimeout(() => {
            expect(clientsWs.length).to.equal(1);
            done();
        }, 10);

    });

});
