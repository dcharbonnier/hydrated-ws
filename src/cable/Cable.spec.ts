import {expect} from "chai";
import {Server, WebSocket as MockWebSocket} from "mock-socket";
import {Cable} from "./Cable";

const URL = "ws://localhost:8080";

describe("cable", () => {

    let mockServer: any;
    let clientWebSocket: any;
    let serverWebSocket: any;
    let cable: Cable;

    beforeEach(async () => {
        mockServer = new Server(URL);
        return new Promise((resolve) => {
            mockServer.on("connection", (ws) => {
                serverWebSocket = ws;
                ws.addEventListener("message", (message) => {
                    try {
                        const data = JSON.parse(message);
                        if (data.method === "resolveMe") {
                            ws.send(JSON.stringify(
                                {
                                    id: data.id,
                                    jsonrpc: "2.0",
                                    result: {test: "success"},
                                }));
                        }
                        if (data.method === "rejectMe") {
                            ws.send(JSON.stringify(
                                {
                                    error: {code: -32000, message: "testError"},
                                    id: data.id,
                                    jsonrpc: "2.0",
                                }));
                        }
                    } catch {
                        // ignore
                    }
                });
                resolve();
            });
            clientWebSocket = new MockWebSocket(URL);
            cable = new Cable(clientWebSocket);

        });
    });

    const waitForMessage = async (): Promise<string> => {
        return new Promise<string>((resolve) => {
            const listener = (evt: string) => {
                resolve(evt);
                mockServer.removeEventListener("message", listener);
            };
            mockServer.addEventListener("message", listener);
        });

    };

    afterEach((done) => {
        mockServer.stop(done);
    });
    describe("request", () => {
        it("send a correctly formatted message", async () => {
            cable.request("methodName");
            const message = await waitForMessage();
            expect(() => JSON.parse(message)).to.not.throw();
            const data = JSON.parse(message);
            expect(data).to.haveOwnProperty("id").to.be.a("string").and.to.have.length.above(0);
            expect(data).to.haveOwnProperty("method").equal("methodName");
            expect(data).to.haveOwnProperty("jsonrpc").equal("2.0");
            expect(data).to.not.haveOwnProperty("params");
        });
        it("send the parameters as an object", async () => {
            cable.request("methodName", {p1: "a", p2: "b"});
            const data = JSON.parse(await waitForMessage());
            expect(data).to.haveOwnProperty("params").deep.equal({p1: "a", p2: "b"});

        });
        it("send the parameters as an array", async () => {
            cable.request("methodName", ["a", "b"]);
            const data = JSON.parse(await waitForMessage());
            expect(data).to.haveOwnProperty("params").deep.equal(["a", "b"]);
        });
        it("refuse null as a parameter", (done) => {
            cable.request("methodName", null).catch(() => done());
        });
        it("refuse a string as a parameter", (done) => {
            cable.request("methodName", "param" as any).catch(() => done());
        });
        it("refuse a number as a parameter", (done) => {
            cable.request("methodName", 99 as any).catch(() => done());
        });
        it("create an id for each request", async () => {
            cable.request("methodName");
            const data1 = JSON.parse(await waitForMessage());
            cable.request("methodName");
            const data2 = JSON.parse(await waitForMessage());
            expect(data1.id).to.not.equal(data2.id);
        });
        it("reject if the request timeout", (done) => {
            cable.request("methodName", undefined, 1).catch(() => done());
        });

        it("should resolve with the response", (done) => {
            cable.request("resolveMe")
                .then((res: any) => {
                    expect(res).to.deep.equal({test: "success"});
                    done();
                });
        });
        it("should resolve with the response", (done) => {
            cable.request("rejectMe")
                .catch((err: any) => {
                    expect(err).to.be.an("error");
                    expect(err.toString()).to.equal("Error: -32000, testError");
                    done();
                });
        });
    });

    describe("notify", () => {
        it("send a correctly formatted message", async () => {
            cable.notify("methodName");
            const message = await waitForMessage();
            expect(() => JSON.parse(message)).to.not.throw();
            const data = JSON.parse(message);
            expect(data).to.not.haveOwnProperty("id");
            expect(data).to.haveOwnProperty("method").equal("methodName");
            expect(data).to.haveOwnProperty("jsonrpc").equal("2.0");
            expect(data).to.not.haveOwnProperty("params");
        });
        it("send the parameters as an object", async () => {
            cable.notify("methodName", {p1: "a", p2: "b"});
            const data = JSON.parse(await waitForMessage());
            expect(data).to.haveOwnProperty("params").deep.equal({p1: "a", p2: "b"});

        });
        it("send the parameters as an array", async () => {
            cable.notify("methodName", ["a", "b"]);
            const data = JSON.parse(await waitForMessage());
            expect(data).to.haveOwnProperty("params").deep.equal(["a", "b"]);
        });
        it("refuse null as a parameter", () => {
            expect(() => cable.notify("methodName", null)).to.throw();
        });
        it("refuse a string as a parameter", () => {
            expect(() => cable.notify("methodName", "param" as any)).to.throw();
        });
        it("refuse a number as a parameter", () => {
            expect(() => cable.notify("methodName", 99 as any)).to.throw();
        });
    });
    describe("register", () => {
        it("call the registered method when a message is received", (done) => {
            cable.register("update", async (params: any) => {
                expect(params).to.deep.equal([1, 2, 3, 4, 5]);
                done();
            });
            serverWebSocket.send(JSON.stringify({jsonrpc: "2.0", method: "update", params: [1, 2, 3, 4, 5]}));
        });
        it("return an error if the method is not registered", async () => {
            serverWebSocket.send(JSON.stringify({id: 4, jsonrpc: "2.0", method: "unknown", params: [1, 2, 3, 4, 5]}));
            const data = JSON.parse(await waitForMessage());
            expect(data).to.deep.equal({ error: { code: -32601, message: "Method not found" },
                jsonrpc: "2.0",
                id: 4 },
            );
        });
    });
    describe("errors", () => {
        it("dispatch an error for an unknown response", (done) => {
            cable.addEventListener("error", (evt: ErrorEvent) => {
                expect(evt.message).to.equal("Response received for an unknown request");
                done();
            });
            serverWebSocket.send(JSON.stringify({jsonrpc: "2.0", result: 19, id: 4}));
        });
        it("dispatch an error if no id is associated", (done) => {
            cable.addEventListener("error", (evt: ErrorEvent) => {
                expect(evt.message).to.equal("-32000, testError");
                done();
            });
            serverWebSocket.send(JSON.stringify({
                error: {code: -32000, message: "testError"},
                jsonrpc: "2.0",
            }));
        });
    });

});
