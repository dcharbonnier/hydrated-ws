import {expect} from "chai";
import WebSocket from "../polyfill/WebSocket";
import {expectEventually, rnd, sleep, supervisor, TIMEOUT_FACTOR} from "../wrench.spec";
import {Dam} from "./Dam";

describe("Dam", () => {
    let ws: WebSocket;
    let testCase: string;

    before(async () => {
        await expectEventually(() => supervisor.ws.readyState === WebSocket.OPEN,
            "The supervisor failed to connect");
    });

    beforeEach((done) => {
        testCase = rnd();
        ws = new WebSocket(`ws://localtest.me:3000/${testCase}`);
        ws.onopen = () => done();
    });

    afterEach(async () => {
        if (ws) {
            ws.close();
        }
    });
    describe("constructor", () => {
        it("should start closed", () => {
            const dam = new Dam(ws);
            expect(dam.status).to.equal("CLOSED");
        });
    });

    describe("when closed", () => {
        let dam;
        beforeEach(() => {
            dam = new Dam(ws);
        });
        it("should throw on send", () => {
            expect(() => dam.send("test")).to.throw();
        });
        it("should never dispatch the open event", async () => {
            dam.onopen = () => {
                throw new Error("Received an open event");
            };
            await sleep(TIMEOUT_FACTOR * 500);
        });
        it("should never dispatch the messages event", async () => {
            ws.send("ping");
            dam.onmessage = () => {
                throw new Error("Received a message event");
            };
            await sleep(TIMEOUT_FACTOR * 500);
        });
        it("should be connecting is the socket is open", async () => {
            expect(dam.readyState).to.equal(dam.CONNECTING);
        });
        it("should be closed is the socket is closed", async () => {
            ws.close();
            await sleep(TIMEOUT_FACTOR * 100);
            expect(dam.readyState).to.equal(dam.CLOSED);
        });

    });
    describe("when open", () => {
        let dam;
        beforeEach(() => {
            dam = new Dam(ws);
            dam.status = "OPEN";
        });
        it("should send", () => {
            expect(() => dam.send("test")).to.not.throw();
        });
        it("should dispatch an open event when the socket open", async () => {
            ws.close();
            ws = new WebSocket(`ws://localtest.me:3000/${testCase}`);
            dam = new Dam(ws);
            dam.status = "OPEN";
            return new Promise(async (resolve, reject) => {
                let received = false;
                dam.onopen = () => {
                    received = true;
                    resolve();
                };
                await sleep(TIMEOUT_FACTOR * 500);
                if (!received) {
                    reject(new Error("Did not received the open"));
                }
            });
        });

        it("should dispatch the messages event", async () => {
            return new Promise(async (resolve, reject) => {
                ws.send("ping");
                let received = false;
                dam.onmessage = () => {
                    received = true;
                    resolve();
                };
                await sleep(TIMEOUT_FACTOR * 500);
                if (!received) {
                    reject(new Error("Did not received the message"));
                }

            });
        });

        it("should be connecting", async () => {
            expect(dam.readyState).to.equal(dam.OPEN);
        });
    });

    describe("when changes to open", () => {
        it("should send an open event if the ws is open", async () => {
            const dam = new Dam(ws);
            return new Promise(async (resolve, reject) => {
                let received = false;
                dam.onopen = () => {
                    received = true;
                    resolve();
                };
                dam.status = "OPEN";
                await sleep(TIMEOUT_FACTOR * 500);
                if (!received) {
                    reject(new Error("Did not receive the open event"));
                }
            });
        });
        it("should do nothing if changed to the same state", async () => {
            const dam = new Dam(ws);
            return new Promise(async (resolve, reject) => {
                let received = 0;
                dam.onopen = () => {
                    received += 1;
                };
                dam.status = "OPEN";
                dam.status = "OPEN";
                await sleep(TIMEOUT_FACTOR * 500);
                expect(received).to.equal(1);
                resolve();
            });
        });
        it("should do nothing if the socket is closed", async () => {
            const dam = new Dam(ws);
            ws.close();
            return new Promise(async (resolve, reject) => {
                try {
                    ws.send("ping");
                } catch {
                    // ignore
                }
                let received = false;
                dam.onopen = () => {
                    received = true;
                    reject(new Error("Did receive an open event"));
                };
                dam.status = "OPEN";
                await sleep(TIMEOUT_FACTOR * 500);
                if (!received) {
                    resolve();
                }
                reject();
            });
        });
    });
    describe("when changes to close", async () => {
        it("should not send a close event", () => {
            const dam = new Dam(ws);
            dam.status = "OPEN";

            return new Promise(async (resolve, reject) => {
                let received = false;
                dam.onclose = () => {
                    received = true;
                    reject(new Error("Received a close event"));
                };
                dam.status = "CLOSED";
                await sleep(TIMEOUT_FACTOR * 500);
                if (!received) {
                    resolve();
                }
            });
        });
    });
});
