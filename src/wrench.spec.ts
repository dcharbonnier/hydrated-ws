export const expect = chai.expect;
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
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
    "ws://example.com:0:0"
];

export const VALID_URLS = [
    "ws://example.com",
    "wss://example.com",
    "ws://example.com/path",
    "wss://example.com/path",
    "ws://example.com:1000",
    "wss://example.com:1000"
];

export const rnd = () => {
    const chars = '_0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghiklmnopqrstuvwxyz';
    let res = "";
    for (let i = 32; i > 0; i--) {
        res += chars[Math.floor(Math.random() * chars.length)];
    }
    return res;
};

export const supervisor = (() => {
    const ws = new WebSocket("ws://local.tawenda-tech.org:3000/supervisor");
    const rpc = [];
    ws.onmessage = (e) => {
        let message = JSON.parse(e.data);
        rpc[message["rpc"]].call(this, message["data"]);
        delete rpc[message["rpc"]];
    };

    ws.onerror = (e) => {
        console.log("supervisor error", e);
    };


    ws.onclose = (e) => {
        console.log("supervisor close", e);
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

export const expectEventually = (f: () => boolean, message: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        let done = false;
        let timeout = setTimeout(() => {
            if (done) {
                return;
            }
            done = true;
            reject(new Error(message))
        }, (TIMEOUT_FACTOR || 1) * 1000);
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