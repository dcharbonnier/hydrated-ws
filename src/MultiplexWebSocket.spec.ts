import {ReconnectWebSocket} from "./ReconnectWebSocket";
import {expect, expectEventually, rnd, sleep, supervisor} from "./tools.spec";
import {MultiplexWebSocket} from "./MultiplexWebSocket";


describe("ReconnectWebSocket", () => {
    let ws: WebSocket;
    let testCase: string;

    before(async () => {
        await expectEventually(() => supervisor.ws.readyState === WebSocket.OPEN,
            "The supervisor failed to connect");
    });
    beforeEach((done) => {
        testCase = rnd();
        this.ws = new WebSocket(`ws://local.tawenda-tech.org:3000/${testCase}`);
        this.ws.onopen = () => done();
    });

    afterEach(async () => {
        if (ws) {
            ws.close();
        }
    });

    describe("constructor", () => {
        it("should throw an error if the channel parameter is invalid", () => {
            ["", 6, NaN, [], {}, "XXXXXXXXXX"].forEach(channel => {
                expect(() => new MultiplexWebSocket(this.ws, channel as any)).to.throw();
            });
        });
    });

    describe("send", () => {
        it("should prefix messages with the channel", async () => {
            const mp = new MultiplexWebSocket(this.ws, "a");
            mp.send("data");
            let logs = await supervisor.logs(testCase);
            expect(logs.map(l => l[1])).to.deep.equal(["connect", "   adata"]);
        });
        it("should refuse a non string message", async () => {
            const mp = new MultiplexWebSocket(this.ws, "a");
            [6, NaN, [], {}].forEach(message => {
                expect(() => mp.send(message)).to.throw();
            });
        });
    });

    describe("receive", () => {
        it("filter the messages", async () => {
            const mpA = new MultiplexWebSocket(this.ws, "a");
            const mpB = new MultiplexWebSocket(this.ws, "b");
            let messagesA = [];
            let messagesB = [];
            mpA.addEventListener("message", (e: MessageEvent) => {
                messagesA.push(e.data);
            });
            mpB.addEventListener("message", (e: MessageEvent) => {
                messagesB.push(e.data);
            });

            mpA.send("ping");
            mpB.send("ping");
            mpB.send("ping");

            await sleep(2000);
            expect(messagesA.length).to.equal(1);
            expect(messagesB.length).to.equal(2);


        });
    });
});
