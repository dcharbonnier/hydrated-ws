import {expect} from "chai";

import {Cable} from "../cable/Cable";
import {Pipe} from "../pipe/Pipe";
import isNode from "../polyfill/isNode";
import WebSocket from "../polyfill/WebSocket";
import * as wormhole from "./index";

describe("Wormhole client", () => {
    if (!isNode || !(WebSocket as any).Server) {
        return;
    }

    const url = `ws://localhost:5478`;
    let mockServer: any;
    let clientsWs: WebSocket[];

    beforeEach(() => {
        mockServer = new (WebSocket as any).Server({
            port: 5478,
        });
        clientsWs = [];

    });

    const waitForConnection = async (): Promise<WebSocket> => {
        return new Promise((resolve) => {
            mockServer.once("connection", (webSocket) => {
                resolve(webSocket);
            });
        });
    };

    const createClient = (ws: WebSocket = new WebSocket(url), uuid: string = "client1") => {
        return new wormhole.Client(uuid, ws, () => {
            clientsWs.push(ws);
        });
    };

    afterEach((done) => {
        mockServer.close(() => done());
    });

    it("client should identify on connect", async () => {
        return new Promise(async (done) => {
            createClient();
            const ws = await waitForConnection();
            const cable = new Cable(new Pipe(ws, "WOHC"));
            cable.register("identity", async (data): Promise<void> => {
                expect(data).to.deep.equal({uuid: "client1"});
                done();
            });

        });
    });

    it("client should identify if the websocket is already open", async () => {
        return new Promise(async (done) => {

            const myWs = new WebSocket(url);
            const ws = await waitForConnection();
            const cable = new Cable(new Pipe(ws, "WOHC"));
            myWs.addEventListener("open", () => {
                new wormhole.Client("client2", myWs, () => {
                    clientsWs.push(myWs);
                });
            });
            cable.register("identity", (data): Promise<void> => {
                if (data.uuid === "client2") {
                    done();
                }
                return new Promise((resolve) => setTimeout(resolve, 0));
            });
        });
    });

    it("client should retry if the identity fail", async () => {
        return new Promise(async (done) => {
            createClient();
            const ws = await waitForConnection();
            const cable = new Cable(new Pipe(ws, "WOHC"));
            let count: number = 0;

            cable.register("identity", (data): Promise<void> => {
                if (count === 1) {
                    done();
                    return new Promise((resolve) => setTimeout(() => resolve(), 0));
                }
                count++;
                return new Promise((resolve, reject) => setTimeout(() => reject(new Error("fail")), 0));
            });
        });

    });
    it("calling twice open should only return one socket", async () => {
        return new Promise(async (done) => {
            createClient();
            const ws = await waitForConnection();
            const cable = new Cable(new Pipe(ws, "WOHC"));
            cable.request("open", {channel: "test"});
            cable.request("open", {channel: "test"});
            setTimeout(() => {
                expect(clientsWs.length).to.equal(1);
                done();
            }, 10);
        });
    });

});
