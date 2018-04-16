import {expect} from "chai";
import WebSocket from "./polyfill/WebSocket";
import {Shell} from "./Shell";
import {rnd} from "./wrench.spec";

class ShellCls extends Shell {

}

describe("Shell", () => {
    describe("constructor", () => {
        it("should throw an error when not using the new operator", () => {
            expect(() => (Shell as any)()).to.throw(TypeError,
                "Failed to construct. Please use the 'new' operator");
        });
    });
    describe("event functions", () => {
        let shell: Shell;
        let ws: WebSocket;
        let url: string;
        beforeEach(() => {
            url = `ws://localtest.me:3000/${rnd()}`;
            ws = new WebSocket(url);
            shell = new ShellCls(ws);
        });
        it("should return the url", () => {
            expect(shell.url).to.equal(url);
        });
        it("should return the extensions", () => {
            expect(shell.extensions).to.equal(ws.extensions);
        });
        it("should return the bufferedAmount", () => {
            expect(shell.bufferedAmount).to.equal(0);
        });
        it("should return the protocol", () => {
            expect(shell.protocol).to.equal(ws.protocol);
        });
        it("should return the onopen function", () => {
            const f = () => null;
            shell.onopen = f;
            expect(shell.onopen).to.equal(f);
        });
        it("should return the onmessage function", () => {
            const f = () => null;
            shell.onmessage = f;
            expect(shell.onmessage).to.equal(f);
        });
        it("should return the onclose function", () => {
            const f = () => null;
            shell.onclose = f;
            expect(shell.onclose).to.equal(f);
        });

        it("should return the onerror function", () => {
            const f = () => null;
            shell.onerror = f;
            expect(shell.onerror).to.equal(f);
        });
    });

    describe("when constructed with a websocket parameter", () => {

        let shell: Shell;

        beforeEach(() => {
            shell = new ShellCls(new WebSocket(`ws://localtest.me:3000/${rnd()}`));
        });
        it("should call the onopen function", (done) => {
            shell.onopen = () => {
                expect(shell.readyState).to.equal(WebSocket.OPEN);
                done();
            };
        });
        it("should call the onclose function", (done) => {
            shell.onclose = () => {
                done();
            };
            shell.onopen = () => {
                shell.send("disconnect");
            };
        });
        it("should call the onmessage function", (done) => {
            shell.onmessage = (e) => {
                if (e.data === "pong") {
                    done();
                }
            };
            shell.onopen = () => {
                shell.send("ping");
            };
        });
        it("should emit an open event", (done) => {
            shell.addEventListener("open", () => {
                done();
            });
        });
        it("should emit a close event", (done) => {
            shell.addEventListener("close", () => {
                done();
            });
            shell.onopen = () => {
                shell.send("disconnect");
            };
        });
        it("should emit a message event", (done) => {
            shell.addEventListener("message", (e) => {
                if (e.data === "pong") {
                    done();
                }
            });
            shell.onopen = () => {
                shell.send("ping");
            };
        });
        it("should remove a listener", (done) => {
            const listener = () => {
                throw new Error("lister still attached");
            };
            shell.addEventListener("message", listener);
            shell.removeEventListener("message", listener);

            shell.onopen = () => {
                shell.send("ping");
            };
            setTimeout(done, 100);
        });
        it("should remove a non existing listener", () => {
            expect(() =>            shell.removeEventListener("message", () => null)).to.not.throw();
        });
        it("should accept more than one listener", (done) => {
            let i = 0;
            const listener = () => {
                i++;
                if (i === 2) {
                    done();
                }
            };
            shell.addEventListener("message", listener);
            shell.addEventListener("message", listener);

            shell.onopen = () => {
                shell.send("ping");
            };
        });
        it("should close the websocket", (done) => {
            shell.onopen = () => {
                shell.close();
                setTimeout(() => {
                    expect(shell.readyState).to.equal(WebSocket.CLOSED);
                    done();
                }, 100);
            };
        });
    });
});
