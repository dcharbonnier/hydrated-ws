import {Dict} from "../polyfill/Dict";
import ErrorEvent from "../polyfill/ErrorEvent";
import {Shell} from "../Shell";
import {uuid} from "./uuid";

const isVoid = (v: any): boolean => v === void 0;
const voidNull = (v: any): any => v === null ? void 0 : v;

export class Cable extends Shell implements WebSocket {

    public static readonly PARSE_ERROR = -32700;
    public static readonly INVALID_REQUEST = -32600;
    public static readonly METHOD_NOT_FOUND = -32601;
    public static readonly INVALID_PARAMS = -32602;
    public static readonly INTERNAL_ERROR = -32603;
    public static readonly SERVER_ERROR = -32000;

    private static readonly id = uuid();
    private static index = 0;

    private calls: Dict<string,
        { resolve: (value?: any) => void, reject: (error?: any) => void, timeout: any }> = new Dict();
    private methods: Dict<string, (params) => Promise<any>> = new Dict();

    constructor(ws: WebSocket) {
        super();
        this.ws = ws;
        this.forwardEvents(["close", "open"]);
        this.ws.addEventListener("message", (e: MessageEvent) => this.receivedMessage(e.data));
    }

    public register(name: string, method: (params: any) => Promise<any>) {
        this.methods.set(name, method);
    }

    public async request(method: string, params?: object | any[], timeout?: number) {
        this.guardParameters(params);
        Cable.index++;
        const id = `${Cable.id}-${Cable.index}`;
        const p = new Promise((resolve, reject) => this.calls.set(id, {
            reject,
            resolve,
            timeout: timeout ? setTimeout(() => this.timeout(id), timeout) : null,
        }));
        this.sendMessage(id, {method, params});
        return p;
    }

    public notify(method: string, params?: object | any[]) {
        this.guardParameters(params);
        this.sendMessage(null, {method, params});
    }

    private guardParameters(params?: object | any[]): void {
        if (params === null || (!isVoid(params) && typeof params !== "object")) {
            throw new Error(
                `params accept an array or an object, provided a ${params === null ? null : typeof params}`);
        }
    }

    private timeout(id: string): void {
        if (this.calls.has(id)) {
            this.calls.get(id).reject(new Error("Request timeout"));
            this.calls.delete(id);
        }
    }

    private sendMessage(id: string, message: any) {
        if (isVoid(id)) {
            return;
        }
        message.jsonrpc = "2.0";
        if (id !== null) {
            message.id = id;
        }
        this.ws.send(JSON.stringify(message));
    }

    private sendError(id: string, code: number, message: string | Error) {
        this.sendMessage(id,
            {
                error: {code, message: message ? message.toString() : "Unknown error"},
            });
    }

    private parseMessage(message: string): any {
        try {
            const data: any = JSON.parse(message);
            data.id = voidNull(data.id);
            return data;
        } catch (e) {
            this.sendError(null, Cable.PARSE_ERROR, e);
            return;
        }

    }

    private receivedMessage(message: string): void {
        const data = this.parseMessage(message);
        if (!data) {
            return;
        }
        if (!isVoid(data.error)) {
            this.rpcError(data.id, data.error.code, data.error.message);
        } else if (!isVoid(data.result)) {
            this.rpcResult(data.id, data.result);
        } else if (!isVoid(data.method)) {
            this.rpcCall(data.id, data.method, data.params);
        } else {
            this.sendError(data.id, Cable.INVALID_PARAMS, "Unknown message type");
        }
    }

    private rpcCall(id: string, method: string, params: any): void {
        if (this.methods.has(method)) {
            this.methods.get(method).call(this, params)
                .then((res) => {
                    this.sendMessage(id, {result: res || null});
                })
                .catch(this.sendError.bind(this, id, Cable.SERVER_ERROR));
        } else {
            this.sendError(id, Cable.METHOD_NOT_FOUND, "Method not found");
        }
    }

    private rpcResult(id: string, results: any): void {
        if (this.calls.has(id)) {
            clearTimeout(this.calls.get(id).timeout);
            this.calls.get(id).resolve(results);
            this.calls.delete(id);

        } else {
            this.dispatchEvent(new ErrorEvent("error", {error: new Error(`Response received for an unknown request`)}));
        }
    }

    private rpcError(id: string, code: number, message: string): void {
        if (this.calls.has(id)) {
            clearTimeout(this.calls.get(id).timeout);
            this.calls.get(id).reject(new Error(`${code}, ${message}`));
            this.calls.delete(id);
        } else {
            this.dispatchEvent(new ErrorEvent("error", {error: new Error(`${code}, ${message}`)}));
        }
    }

}
