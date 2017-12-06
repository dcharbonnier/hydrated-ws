import {expect} from "chai";
import {Dam} from "../dam/Dam";
import WebSocket from "../polyfill/WebSocket";
import {expectEventually, rnd, sleep, supervisor, TIMEOUT_FACTOR} from "../wrench.spec";
import {Tank} from "./Tank";

describe("Tank", () => {
    let ws: WebSocket;
    let testCase: string;
    before(async () => {
        await expectEventually(() => supervisor.ws.readyState === WebSocket.OPEN,
            "The supervisor failed to connect");
    });
    afterEach(async () => {
        if (ws) {
            ws.close();
        }
    });

    beforeEach((done) => {
        testCase = rnd();
        ws = new WebSocket(`ws://localtest.me:3000/${testCase}`);
        ws.onopen = () => done();
    });

    it("should store the message while the socket is closed and release when open", async () => {
        const dam = new Dam(ws);
        const tank = new Tank(dam);
        tank.send("before open");
        dam.status = "OPEN";
        await sleep(TIMEOUT_FACTOR * 100);
        const logs = await supervisor.logs(testCase);
        expect(logs.map((l) => l[1])).to.deep.equal(["connect", "before open"]);
    });

    it("should let the messages pass when open", async () => {
        const dam = new Dam(ws);
        const tank = new Tank(dam);
        dam.status = "OPEN";
        tank.send("after open");
        await sleep(TIMEOUT_FACTOR * 100);
        const logs = await supervisor.logs(testCase);
        expect(logs.map((l) => l[1])).to.deep.equal(["connect", "after open"]);
    });

});
