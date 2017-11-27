import {AdvancedWebSocket} from "./AdvancedWebSocket";
const expect = chai.expect;

const captureError = (f: () => any): Error => {
    try {
        f();
    } catch (e) {
        return e;
    }
    throw new Error("f should throw an error");
};

const INVALID_URLS = [
    "",
    "http://example.com",
    "ws://example.com:0:0"
];

const VALID_URLS = [
    "ws://example.com",
    "wss://example.com",
    "ws://example.com/path",
    "wss://example.com/path",
    "ws://example.com:1000",
    "wss://example.com:1000"
];

const rnd = () => {
    const chars = '_0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghiklmnopqrstuvwxyz';
    let res = "";
    for (let i = 32; i > 0; i--) {
        res += chars[Math.floor(Math.random() * chars.length)];
    }
    return res;
};

const supervisor = (() => {
    const ws = new WebSocket("ws://localhost:8088/supervisor");
    const rpc = [];
    ws.onmessage = (e) => {
        let message = JSON.parse(e.data);
        rpc[message["rpc"]].call(this, message["data"]);
        delete rpc[message["rpc"]];
    };

    return {
        ws,
        logs: async (testCase: string) => new Promise<any>(resolve => {
            const id = rnd();
            rpc[id] = resolve;
            ws.send(JSON.stringify({rpc: id, method: "logs", args: {testCase}}));
        }),
        setup: async (testCase: string, setup: object) => new Promise(resolve => {
            const id = rnd();
            rpc[id] = resolve;
            ws.send(JSON.stringify({rpc: id, method: "setup", args: {testCase, setup}}));
        })
    }
})();


const expectEventually = (f: () => boolean, message: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        let done = false;
        let timeout = setTimeout(() => {
            if(done) {
                return;
            }
            done = true;
            reject(new Error(message))
        }, 10000);
        const test = () => {
            if (done) {
                return;
            }
            try {
                if (f()) {
                    done = true;
                    clearTimeout(timeout);
                    resolve();
                } else {
                    setTimeout(() => test(), 10);
                }
            } catch (e) {
                done = true;
                clearTimeout(timeout);
                reject(e);
            }
        };
        test();
    });
};

describe("AdvancedWebSocket", () => {
    let ws: AdvancedWebSocket;
    before(async() => {
        await expectEventually(() => supervisor.ws.readyState === WebSocket.OPEN,
            "The supervisor failed to connect");
    });
    afterEach(async() => {
        if(ws) {
            ws.close();
        }
    });
    describe("constructor", () => {
        it("should throw an error when not using the new operator", () => {
            const error = captureError(() => (WebSocket as any)());
            expect(() => (AdvancedWebSocket as any)("")).to.throw(error.constructor, error.message);
        });

        it("should throw an error when using a bad url", () => {
            INVALID_URLS.forEach(url => {
                expect(() => new AdvancedWebSocket(url)).to.throw(Error, captureError(() => new WebSocket(url)).message);
            });
        });

        it("should not throw when using a correct url", () => {
            VALID_URLS.forEach(url => {
                expect(() => new AdvancedWebSocket(url)).to.not.throw();
            });
        });
        it("should immediately connect to the server", async () => {
            ws = new AdvancedWebSocket("ws://localhost:8088");
            expect(ws.readyState).to.equal(WebSocket.CONNECTING);
            return expectEventually(() => ws.readyState === WebSocket.OPEN, "The WebSocket should be open");
        })
    });
    describe("when connected", () => {
        let ws: AdvancedWebSocket;

        beforeEach(async () => {
            ws = new AdvancedWebSocket("ws://localhost:8088");
            expect(ws.readyState).to.equal(WebSocket.CONNECTING);
            await expectEventually(() => ws.readyState === WebSocket.OPEN, "The WebSocket should be open");
            return
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
        let ws: AdvancedWebSocket;
        let testCase: string;
        beforeEach(async () => {
            testCase = rnd();
            ws = new AdvancedWebSocket(`ws://localhost:8088/${testCase}`);
            expect(ws.readyState).to.equal(WebSocket.CONNECTING);
            await expectEventually(() => ws.readyState === WebSocket.OPEN,
                "The WebSocket should be open");
        });

        it("should not receive a close event", async () => {
            return new Promise((resolve, reject) => {
                ws.onclose = () => {
                    reject(new Error("Received a close event"));
                }
                ws.send("disconnect");
                setTimeout(() => resolve(), 100);
            });
        });
        it("should be on a connecting state", async () => {
            ws.send("disconnect");
            await expectEventually(() => ws.readyState === WebSocket.CONNECTING,
                "The WebSocket should be connecting");
        });
        it("should eventually reconnect", async () => {
            ws.send("disconnect");
            await expectEventually(() => ws.readyState === WebSocket.CONNECTING,
                "The WebSocket should be connecting");
            await expectEventually(() => ws.readyState === WebSocket.OPEN,
                "The WebSocket should be open");
            let logs = await supervisor.logs(testCase);
            expect(logs.map(l => l[1])).to.deep.equal(["connect", "disconnect", "close", "connect"]);
        });

    });
    describe("events", () => {
        let ws: AdvancedWebSocket;
        let testCase: string;
        beforeEach(async () => {
            testCase = rnd();
        });
        it("should dispatch the open event", async () => {
            return new Promise(async (resolve, reject) => {
                ws = new AdvancedWebSocket(`ws://localhost:8088/${testCase}`);
                const events = [];
                ws.onopen = (event) => {
                    expect(events.length).to.equal(0);
                    events.push(event);
                }
                ws.addEventListener("open", (event) => {
                    expect(events.length).to.equal(1);
                    events.push(event);
                });
                ws.addEventListener("open", (event) => {
                    expect(events.length).to.equal(2);
                    events.push(event);
                });
                const timeout = setTimeout(() => reject && reject(new Error("did not received the open event")), 5000);
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
                ws = new AdvancedWebSocket(`ws://localhost:8088/${testCase}`);
                const events = [];
                ws.onclose = (event) => {
                    expect(events.length).to.equal(0);
                    events.push(event);
                }
                ws.addEventListener("close", (event) => {
                    expect(events.length).to.equal(1);
                    events.push(event);
                });
                ws.addEventListener("close", (event) => {
                    expect(events.length).to.equal(2);
                    events.push(event);
                });
                const timeout = setTimeout(() => reject && reject(new Error("did not received the close event")), 5000);
                await expectEventually(() => ws.readyState === WebSocket.OPEN,
                    "The WebSocket should be open");
                ws.close();
                await expectEventually(() =>events.length === 3,
                    "Did not received the close event");
                clearTimeout(timeout);
                reject = null;
                expect(events.length).to.equal(3);
                resolve();
            });
        });
        it("should remove the registered listeners", async () => {
            return new Promise(async (resolve, reject) => {
                ws = new AdvancedWebSocket(`ws://localhost:8088/${testCase}`);
                const listener = (event) => {
                    reject(new Error("this listener should be removes"));
                };
                ws.addEventListener("open", listener);
                ws.removeEventListener("open", listener);
                const timeout = setTimeout(() => reject && reject(new Error("did not received the open event")), 5000);
                await expectEventually(() => ws.readyState === WebSocket.OPEN,
                    "The WebSocket should be open");
                clearTimeout(timeout);
                reject = null;
                resolve();
            });
        });
        it("should ignore an unexisting listener", async () => {
            ws = new AdvancedWebSocket(`ws://localhost:8088/${testCase}`);
            ws.removeEventListener("ignore me" as any, () => {
            });

        });
        it("should stop dispatching the events if one return false", async () => {
            return new Promise(async (resolve, reject) => {
                ws = new AdvancedWebSocket(`ws://localhost:8088/${testCase}`);
                const events = [];
                ws.onopen = (event) => {
                    expect(events.length).to.equal(0);
                    events.push(event);
                }
                ws.addEventListener("open", (event) => {
                    expect(events.length).to.equal(1);
                    events.push(event);
                    return false;
                });
                ws.addEventListener("open", (event) => {
                    reject(new Error("this listener not be call"));
                    events.push(event);
                });
                const timeout = setTimeout(() => reject && reject(new Error("did not received the open event")), 5000);
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
            ws = new AdvancedWebSocket(`ws://localhost:8088/${testCase}`);
            expect(ws.readyState).to.equal(WebSocket.CONNECTING);
            await expectEventually(() => ws.readyState === WebSocket.OPEN,
                "The WebSocket should be open");
            let logs = await supervisor.logs(testCase);
            expect(logs.map(l => l[1])).to.deep.equal(["connect", "connect", "connect"]);
        });
        it("should retry if the first connection timeout", async () => {
            const testCase = rnd();
            await supervisor.setup(testCase, [{delay: 2000}]);
            ws = new AdvancedWebSocket(`ws://localhost:8088/${testCase}`, null, {connectionTimeout: 100});
            expect(ws.readyState).to.equal(WebSocket.CONNECTING);
            await expectEventually(() => ws.readyState === WebSocket.OPEN,
                "The WebSocket should be open");
            let logs = await supervisor.logs(testCase);
            expect(logs.map(l => l[1])).to.deep.equal(["connect", "connect"]);
        });

    });
    describe("properties", () => {
        it("should return the socket properties", async () => {
            const testCase = rnd();
            ws = new AdvancedWebSocket(`ws://localhost:8088/${testCase}`);
            expect(ws.extensions).to.equal("");
            expect(ws.protocol).to.equal("");
            expect(ws.bufferedAmount).to.equal(0);

        });
    });
    describe("when close", () => {
        it("should not reconnect", async () => {
            const testCase = rnd();
            ws = new AdvancedWebSocket(`ws://localhost:8088/${testCase}`);
            expect(ws.readyState).to.equal(WebSocket.CONNECTING);
            await expectEventually(() => ws.readyState === WebSocket.OPEN,
                "The WebSocket should be open");
            ws.close();
            await expectEventually(() => ws.readyState === WebSocket.CLOSED,
                "The WebSocket should be closed");


        });
        it("should pass the close reason to the server", async () => {
            const testCase = rnd();
            ws = new AdvancedWebSocket(`ws://localhost:8088/${testCase}`);
            expect(ws.readyState).to.equal(WebSocket.CONNECTING);
            await expectEventually(() => ws.readyState === WebSocket.OPEN,
                "The WebSocket should be open");
            ws.close(3001, "because I wan't");
            await expectEventually(() => ws.readyState === WebSocket.CLOSED,
                "The WebSocket should be closed");
            let logs = await supervisor.logs(testCase);
            expect(logs.map(l => l[1])).to.deep.equal(["connect", "close"]);
            expect(logs[1].slice(1)).to.deep.equal(["close", [3001, "because I wan't"]]);

        });
        it("should ignore a second close", async () => {
            const testCase = rnd();
            ws = new AdvancedWebSocket(`ws://localhost:8088/${testCase}`);
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