import { expect } from "chai";
import WebSocket from "../polyfill/WebSocket";
import { expectEventually, rnd, sleep, supervisor, TIMEOUT_FACTOR } from "../wrench.spec";
import { Fizz } from "./Fizz";

let ws: WebSocket;
let testCase: string;

const testListener = (method: "addListener"|"on"|"once") => {

    describe(`listener with ${method}`, () => {

        it ("close", (done) => {
            const fizz = new Fizz(ws);
            fizz[method]("close", (...args: any[]) => {
                expect(args).to.deep.equal([1000, ""]);
                done();
            });
            fizz.close();
        });

        it.skip ("error", (done) => {
            const fizz = new Fizz(ws);
            fizz[method]("error", (...args: any[]) => {
                expect(args).to.have.lengthOf(1);
                expect(args[0]).to.be.instanceof(Error);
                done();
            });
        });

        it ("message", (done) => {
            const fizz = new Fizz(ws);
            fizz[method]("message", (...args: any[]) => {
                expect(args).to.deep.equal(["pong"]);
                done();
            });
            ws.send("ping");
        });

        it ("open", (done) => {
            const fizz = new Fizz(new WebSocket(`ws://localtest.me:4752/${rnd()}`));
            fizz[method]("open", (...args: any[]) => {
                expect(args).to.deep.equal([]);
                done();
            });
        });

    });
};

describe("Fizz", () => {
    before(async () => {
        await expectEventually(() => supervisor.ws.readyState === WebSocket.OPEN,
            "The supervisor failed to connect");
    });

    beforeEach((done) => {
        testCase = rnd();
        ws = new WebSocket(`ws://localtest.me:4752/${testCase}`);
        ws.onopen = () => done();
    });

    afterEach(async () => {
        if (ws) {
            ws.close();
        }
    });

    describe("addListener", () => {
        testListener("addListener");
    });

    describe("on", () => {
        testListener("on");
    });

    describe("once", () => {
        testListener("once");
    });

    describe("prependListener", () => {

    });

    describe("prependOnceListener", () => {

    });

    describe("removeListener", () => {

    });

    describe("off", () => {

    });

    describe("removeAllListeners", () => {

    });

    describe("setMaxListeners", () => {

    });

    describe("getMaxListeners", () => {

    });

    describe("listeners", () => {

    });

    describe("rawListeners", () => {

    });

});
