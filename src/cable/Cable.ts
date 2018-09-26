import { Dict } from "../polyfill/Dict";
import ErrorEvent from "../polyfill/ErrorEvent";
import { Shell } from "../Shell";
import { CableError } from "./CableError";
import { uuid } from "./uuid";

const isVoid = (v: any): boolean => v === void 0;
const voidNull = (v: any): any => v === null ? void 0 : v;

/**
 * RPC over websocket, using the JSON-RPC 2.0 Specification
 * http://www.jsonrpc.org/specification
 *
 * A `Cable` establish an RPC communication over a websocket, there is no server/client role, the same cable can
 * you can define methods on both sides of the cable and call the remote methods
 *
 * @example
 * ```typescript
 *
 * // Client 1
 * const cable = new Cable(ws);
 * cable.register("ping", async () => {
 *   return "pong";
 * });
 * cable.notify("hello", {name:"client 1"});
 *
 * // Client 2
 * const cable = new Cable(ws);
 * cable.register("hello", async ({name:string}) => {
 *   console.log(`${name} said hello`);
 *  });
 * try {
 *   const res = await cable.request("ping");
 *   assert.equal(res,"pong");
 * } catch(e) {
 *   if(e.code === Cable.SERVER_ERROR) {
 *     console.log("Implementation error on the server");
 *   }
 *   throw e;
 * }
 * ```
 */

export class Cable extends Shell {

    /**
     *  Invalid JSON was received by the server.
     *  An error occurred on the server while parsing the JSON text.
     */
    public static readonly PARSE_ERROR = -32700;

    /**
     * The JSON sent is not a valid Request object.
     */
    public static readonly INVALID_REQUEST = -32600;

    /**
     *  The method does not exist / is not available.
     */
    public static readonly METHOD_NOT_FOUND = -32601;

    /**
     *  Invalid method parameter(s).
     */
    public static readonly INVALID_PARAMS = -32602;

    /**
     *  Internal JSON-RPC error.
     */
    public static readonly INTERNAL_ERROR = -32603;

    /**
     * Generic server-errors
     */
    public static readonly SERVER_ERROR = -32000;

    /**
     * Timeout server-errors
     */
    public static readonly TIMEOUT_ERROR = -32001;

    /**
     * Response received for an unknown request server-errors
     */
    public static readonly UNKNOWN_REQUEST = -32002;

    /**
     *  Invalid method parameter(s) on the client
     */
    public static readonly INVALID_CLIENT_PARAMS = -32603;

    private static readonly id = uuid();
    private static index = 0;

    private calls: Dict<string,
        { resolve: (value?: any) => void, reject: (error?: any) => void, timeout: any }> = new Dict();
    private methods: Dict<string, (params) => Promise<any>> = new Dict();

    /**
     * @param ws  An object compatible with the WebSocket interface.
     */
    constructor(ws: WebSocket) {
        super();
        this.ws = ws;
        this.forwardEvents(["close", "open"]);
        this.ws.addEventListener("message", (e: MessageEvent) => this.receivedMessage(e.data));
    }

    /**
     * Register a new method on the websocket
     * @param {string} method name
     * @param {(params: any) => Promise<any>} method handler
     */
    public register(name: string, method: (params: any) => Promise<any>) {
        this.methods.set(name, method);
    }

    /**
     * Make a Rpc call
     * @param {string} method name
     * @param {object | any[]} params
     * @param {number} if set will reject if no response is received after `timeout` ms
     * @returns {Promise<any>}
     */
    public async request(method: string, params?: object | any[], timeout?: number) {
        this.guardParameters(params);
        Cable.index++;
        const id = `${Cable.id}-${Cable.index}`;
        const p = new Promise((resolve, reject) => this.calls.set(id, {
            reject,
            resolve,
            timeout: timeout ? setTimeout(() => this.timeout(id), timeout) : null,
        }));
        this.sendMessage(id, { method, params });
        return p;
    }

    /**
     * Unlike the _request_, notify will not wait for the server to reply
     * @param {string} method name
     * @param {object | any[]} params
     * @returns {Promise<any>}
     */
    public notify(method: string, params?: object | any[]) {
        this.guardParameters(params);
        this.sendMessage(null, { method, params });
    }

    private guardParameters(params?: object | any[]): void {
        if (params === null || (!isVoid(params) && typeof params !== "object")) {
            throw new CableError(
                `params accept an array or an object, provided a ${params === null ? null : typeof params}`,
                Cable.INVALID_CLIENT_PARAMS,
            );
        }
    }

    private timeout(id: string): void {
        if (this.calls.has(id)) {
            this.calls.get(id).reject(new CableError("Request timeout", Cable.TIMEOUT_ERROR));
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
        try {
            this.ws.send(JSON.stringify(message));
        } catch (e) {
            // ignore
        }

    }

    private sendError(id: string, code: number, messageOrError: string | Error) {
        let message = messageOrError ? messageOrError.toString() : "Unknown error";
        if (messageOrError instanceof CableError) {
            code = messageOrError.code;
            message = messageOrError.message;
        }
        this.sendMessage(id, { error: { code, message } });
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
                    this.sendMessage(id, { result: res || null });
                })
                .catch(this.sendError.bind(this, id, Cable.SERVER_ERROR));
        } else {
            this.sendError(id, Cable.METHOD_NOT_FOUND, `Method '${method}' not found`);
        }
    }

    private rpcResult(id: string, results: any): void {
        if (this.calls.has(id)) {
            clearTimeout(this.calls.get(id).timeout);
            this.calls.get(id).resolve(results);
            this.calls.delete(id);

        } else {
            this.dispatchEvent(new ErrorEvent("error", {
                error:
                    new CableError(`Response received for an unknown request`, Cable.UNKNOWN_REQUEST),
            }));
        }
    }

    private rpcError(id: string, code: number, message: string): void {
        const error = new CableError(message, code);
        if (this.calls.has(id)) {
            clearTimeout(this.calls.get(id).timeout);
            this.calls.get(id).reject(error);
            this.calls.delete(id);
        } else {
            this.dispatchEvent(new ErrorEvent("error", { error }));
        }
    }

}
