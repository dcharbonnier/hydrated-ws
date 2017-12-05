import {expect} from "chai";
import {Waterfall} from "./Waterfall";
import WebSocket from "./WebSocket";
import {expectEventually, INVALID_URLS, rnd, sleep, supervisor, TIMEOUT_FACTOR, VALID_URLS} from "./wrench.spec";

describe("Waterfall", () => {
    let ws: Waterfall;
    before(async () => {
        await expectEventually(() => supervisor.ws.readyState === WebSocket.OPEN,
            "The supervisor failed to connect");
    });
    afterEach(async () => {
        if (ws) {
            ws.close();
        }
    });
    describe("constructor", () => {
        it("should throw an error when not using the new operator", () => {
            expect(() => (Waterfall as any)("")).to.throw(TypeError,
                "Failed to construct. Please use the 'new' operator");
        });

        it("should throw an error when using a bad url", () => {
            INVALID_URLS.forEach((url) => {
                expect(() => new Waterfall(url)).to.throw();
            });
        });

        it("should not throw when using a correct url", () => {
            VALID_URLS.forEach((url) => {
                expect(() => new Waterfall(url)).to.not.throw();
            });
        });
        it("should immediately connect to the server", async () => {
            ws = new Waterfall("ws://localtest.me:3000");
            expect(ws.readyState).to.equal(WebSocket.CONNECTING);
            return expectEventually(() => ws.readyState === WebSocket.OPEN,
                "The WebSocket should be open");
        });
    });
    describe("when connected", () => {

        beforeEach(async () => {
            ws = new Waterfall("ws://localtest.me:3000");
            expect(ws.readyState).to.equal(WebSocket.CONNECTING);
            await expectEventually(() => ws.readyState === WebSocket.OPEN,
                "The WebSocket should be open");
            return;
        });

        it("should send a message to the server", async () => {
            return new Promise((resolve) => {
                ws.onmessage = (ev) => {
                    if (ev.data === "pong") {
                        resolve();
                    }
                };
                ws.send("ping");
            });
        });

    });
    describe("when disconnect", () => {
        let testCase: string;
        beforeEach(async () => {
            testCase = rnd();
            ws = new Waterfall(`ws://localtest.me:3000/${testCase}`);
            expect(ws.readyState).to.equal(WebSocket.CONNECTING);
            await expectEventually(() => ws.readyState === WebSocket.OPEN,
                "The WebSocket should be open");
        });

        it("should not receive a close event", async () => {
            return new Promise((resolve, reject) => {
                ws.onclose = () => {
                    reject(new Error("Received a close event"));
                };
                ws.send("disconnect");
                setTimeout(() => resolve(), 100);
            });
        });
        // the api do not define an event, there is no way to test that on a reliable way
        it.skip("should be on a connecting state", async () => {
            ws.send("disconnect");
            await expectEventually(() => ws.readyState === WebSocket.CONNECTING,
                "The WebSocket should be connecting");
        });
        it("should eventually reconnect", async () => {
            ws.send("disconnect");
            // the api do not define an event, there is no way to test that on a reliable way
            // await expectEventually(() => ws.readyState === WebSocket.CONNECTING,
            //     "The WebSocket should be connecting");
            await sleep(TIMEOUT_FACTOR * 500);
            await expectEventually(() => ws.readyState === WebSocket.OPEN,
                "The WebSocket should be connected");
            const logs = await supervisor.logs(testCase);
            expect(logs.map((l) => l[1])).to.deep.equal(["connect", "disconnect", "close", "connect"]);
        });

    });
    describe("events", () => {
        let testCase: string;
        beforeEach(async () => {
            testCase = rnd();
        });
        it("should dispatch the open event", async () => {
            return new Promise(async (resolve, reject) => {
                ws = new Waterfall(`ws://localtest.me:3000/${testCase}`);
                const events = [];
                ws.onopen = (event) => {
                    expect(events.length).to.equal(0);
                    events.push(event);
                };
                ws.addEventListener("open", (event) => {
                    expect(events.length).to.equal(1);
                    events.push(event);
                });
                ws.addEventListener("open", (event) => {
                    expect(events.length).to.equal(2);
                    events.push(event);
                });
                const timeout = setTimeout(() => reject &&
                    reject(new Error("did not received the open event")), 5000);
                await expectEventually(() => ws.readyState === WebSocket.OPEN,
                    "The WebSocket should be open");
                expect(events.length).to.equal(3);
                clearTimeout(timeout);
                reject = null;
                resolve();
            });
        });
        it("should dispatch the close event", async () => {
            return new Promise(async (resolve, reject) => {
                ws = new Waterfall(`ws://localtest.me:3000/${testCase}`);
                const events = [];
                ws.onclose = (event) => {
                    expect(events.length).to.equal(0);
                    events.push(event);
                };
                ws.addEventListener("close", (event) => {
                    expect(events.length).to.equal(1);
                    events.push(event);
                });
                ws.addEventListener("close", (event) => {
                    expect(events.length).to.equal(2);
                    events.push(event);
                });
                const timeout = setTimeout(() => reject &&
                    reject(new Error("did not received the close event")), 5000);
                await expectEventually(() => ws.readyState === WebSocket.OPEN,
                    "The WebSocket should be open");
                ws.close();
                await expectEventually(() => events.length === 3,
                    "Did not received the close event");
                clearTimeout(timeout);
                reject = null;
                resolve();
            });
        });
        it("should remove the registered listeners", async () => {
            return new Promise(async (resolve, reject) => {
                ws = new Waterfall(`ws://localtest.me:3000/${testCase}`);
                const listener = (event) => {
                    reject(new Error("this listener should be removes"));
                };
                ws.addEventListener("open", listener);
                ws.removeEventListener("open", listener);
                await expectEventually(() => ws.readyState === WebSocket.OPEN,
                    "The WebSocket should be open");
                reject = null;
                resolve();
            });
        });
        it("should ignore an unexisting listener", async () => {
            ws = new Waterfall(`ws://localtest.me:3000/${testCase}`);
            ws.removeEventListener("ignore me" as any, () => {
                // ignore
            });

        });
        it("should stop dispatching the events if one return false", async () => {
            return new Promise(async (resolve, reject) => {
                ws = new Waterfall(`ws://localtest.me:3000/${testCase}`);
                const events = [];
                ws.onopen = (event) => {
                    expect(events.length).to.equal(0);
                    events.push(event);
                };
                ws.addEventListener("open", (event) => {
                    expect(events.length).to.equal(1);
                    events.push(event);
                    return false;
                });
                ws.addEventListener("open", (event) => {
                    reject(new Error("this listener not be call"));
                    events.push(event);
                });
                const timeout = setTimeout(() => reject &&
                    reject(new Error("did not received the open event")), 5000);
                await expectEventually(() => ws.readyState === WebSocket.OPEN,
                    "The WebSocket should be open");
                expect(events.length).to.equal(2);
                clearTimeout(timeout);
                reject = null;
                resolve();
            });
        });
    });
    describe("when reconnect", () => {
        it("should connect after 2 failures", async () => {
            const testCase = rnd();
            await supervisor.setup(testCase, [{fail: true}, {fail: true}]);
            ws = new Waterfall(`ws://localtest.me:3000/${testCase}`);
            expect(ws.readyState).to.equal(WebSocket.CONNECTING);
            await expectEventually(() => ws.readyState === WebSocket.OPEN,
                "The WebSocket should be open");
            const logs = await supervisor.logs(testCase);
            expect(logs.map((l) => l[1])).to.deep.equal(["connect", "connect", "connect"]);
        });
        it("should retry if the first connection timeout", async () => {
            const testCase = rnd();
            await supervisor.setup(testCase, [{delay: TIMEOUT_FACTOR * 300}]);
            ws = new Waterfall(
                `ws://localtest.me:3000/${testCase}`,
                null,
                {connectionTimeout: (TIMEOUT_FACTOR || 1) * 200});
            expect(ws.readyState).to.equal(WebSocket.CONNECTING);
            await expectEventually(() => ws.readyState === WebSocket.OPEN,
                "The WebSocket should be open");
            const logs = await supervisor.logs(testCase);
            expect(logs.map((l) => l[1]).filter((m) => m === "connect").length).to.be.greaterThan(1);
        });

    });
    describe("properties", () => {
        it("should return the socket properties", async () => {
            const testCase = rnd();
            ws = new Waterfall(`ws://localtest.me:3000/${testCase}`);
            expect(ws.extensions).to.equal("");
            expect(ws.protocol).to.equal("");
            expect(ws.bufferedAmount).to.equal(0);

        });
    });
    describe("when close", () => {
        it("should not reconnect", async () => {
            const testCase = rnd();
            ws = new Waterfall(`ws://localtest.me:3000/${testCase}`);
            expect(ws.readyState).to.equal(WebSocket.CONNECTING);
            await expectEventually(() => ws.readyState === WebSocket.OPEN,
                "The WebSocket should be open");
            ws.close();
            await expectEventually(() => ws.readyState === WebSocket.CLOSED,
                "The WebSocket should be closed");

        });
        it("should pass the close reason to the server", async () => {
            const testCase = rnd();
            ws = new Waterfall(`ws://localtest.me:3000/${testCase}`);
            expect(ws.readyState).to.equal(WebSocket.CONNECTING);
            await expectEventually(() => ws.readyState === WebSocket.OPEN,
                "The WebSocket should be open");
            ws.close(3001, "because I wan't");
            await expectEventually(() => ws.readyState === WebSocket.CLOSED,
                "The WebSocket should be closed");
            const logs = await supervisor.logs(testCase);
            expect(logs.map((l) => l[1])).to.deep.equal(["connect", "close"]);
            expect(logs[1].slice(1)).to.deep.equal(["close", [3001, "because I wan't"]]);

        });
        it("should ignore a second close", async () => {
            const testCase = rnd();
            ws = new Waterfall(`ws://localtest.me:3000/${testCase}`);
            expect(ws.readyState).to.equal(WebSocket.CONNECTING);
            await expectEventually(() => ws.readyState === WebSocket.OPEN,
                "The WebSocket should be open");
            ws.close();
            ws.close();
            await expectEventually(() => ws.readyState === WebSocket.CLOSED,
                "The WebSocket should be closed");
        });

    });
});
