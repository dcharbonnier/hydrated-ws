import WebSocket from "ws";

const logs = {};

const log = (testCase, message, extra) => {
    if (!logs[testCase]) {
        logs[testCase] = [];
    }
    logs[testCase].push([Date.now(), message, extra]);
};

const testCaseSetup = {};
const reqCount = {};

const wss = new WebSocket.Server({
    port: 4752,
    host: "0.0.0.0",
    verifyClient: (info, done) => {
        if (info.req.url === "/supervisor") {
            return done(true);
        }
        const testCase = info.req.url.slice(1);
        log(testCase, "connect");
        const setup = testCaseSetup[testCase] && testCaseSetup[testCase][reqCount[testCase] || 0];
        if (setup) {
            if (setup.delay) {
                setTimeout(() => {
                    done(!setup.fail);
                }, setup.delay);
            } else {
                done(!setup.fail);
            }
            if (reqCount[testCase]) {
                reqCount[testCase] = reqCount[testCase] + 1;
            } else {
                reqCount[testCase] = 1;
            }
        } else {
            done(true);
        }

    },
});


wss.on('connection', (ws, request) => {
    if (request.url === "/supervisor") {
        ws.on('message', (message) => {
            let data = JSON.parse(message);
            const method = data.method;
            if (method === "logs") {
                ws.send(JSON.stringify({
                    rpc: data["rpc"],
                    data: logs[data.args.testCase]
                }));
            }
            else if (method === "setup") {
                testCaseSetup[data.args.testCase] = data.args.setup;
                ws.send(JSON.stringify({
                    rpc: data["rpc"]
                }));
            }
        });
    } else {
        const testCase = request.url.slice(1);
        ws.on('close', (code, reason) => {
            log(testCase, "close", [code, reason]);
        });
        ws.on('message', (message) => {
            log(testCase, message);
            if (message === "ping") {
                try {
                    ws.send("pong");
                } catch (e) {
                }
            } else if (message === "disconnect") {
                try {
                    setTimeout(() => ws.terminate(), 100);
                } catch (e) {
                }
            } else if (message.substr(4) === "ping") {
                ws.send(message.replace("ping", "pong"));
            }
            // try {
            //     ws.send("hello");
            // } catch (e) {
            // }
        });

    }

});