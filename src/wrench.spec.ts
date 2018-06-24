// declare const expect;
import WebSocket from "./polyfill/WebSocket";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const TIMEOUT_FACTOR = 1;

export const captureError = (f: () => any): Error => {
    try {
        f();
    } catch (e) {
        return e;
    }
    throw new Error("f should throw an error");
};

export const INVALID_URLS = [
    "",
    "http://example.com",
    "ws://example.com:0:0",
];

export const VALID_URLS = [
    "ws://example.com",
    "wss://example.com",
    "ws://example.com/path",
    "wss://example.com/path",
    "ws://example.com:1000",
    "wss://example.com:1000",
];

export const rnd = () => {
    const chars = "_0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghiklmnopqrstuvwxyz";
    let res = "";
    for (let i = 32; i > 0; i--) {
        res += chars[Math.floor(Math.random() * chars.length)];
    }
    return res;
};

export const supervisor = (() => {
    const ws = new WebSocket("ws://localtest.me:4752/supervisor");
    const rpc = [];
    ws.onmessage = (e) => {
        const message = JSON.parse(e.data);
        rpc[message.rpc].call(this, message.data);
        delete rpc[message.rpc];
    };

    ws.onerror = (e) => {
        // ignore
    };

    ws.onclose = (e) => {
        // ignore
    };

    return {
        logs: async (testCase: string) => new Promise<any>((resolve) => {
            const id = rnd();
            rpc[id] = resolve;
            ws.send(JSON.stringify({rpc: id, method: "logs", args: {testCase}}));
        }),
        setup: async (testCase: string, setup: object) => new Promise((resolve) => {
            const id = rnd();
            rpc[id] = resolve;
            ws.send(JSON.stringify({rpc: id, method: "setup", args: {testCase, setup}}));
        }),
        ws,
    };
})();

export const expectEventually = (f: () => boolean, message: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        let done = false;
        const timeout = setTimeout(() => {
            if (done) {
                return;
            }
            done = true;
            reject(new Error(message));
        }, TIMEOUT_FACTOR * 1000);
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
                    setTimeout(() => test(), 50);
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
