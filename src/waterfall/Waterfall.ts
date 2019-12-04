import CloseEvent from "../polyfill/CloseEvent";
import CustomEvent from "../polyfill/CustomEvent";
import WebSocket from "../polyfill/WebSocket";
import { Shell } from "../Shell";
import { exponentialTruncatedBackoff } from "./exponentialTruncatedBackoff";
import { IWaterfallOptions } from "./IWaterfallOptions";

// https://gist.github.com/hansifer/32bcba48c24621c2da78
/* tslint:disable-next-line */
export const REGEXP_URL = /^wss?:(?:\/\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~!\$&'\(\)\*\+,;=:\xA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[\uD800-\uD83E\uD840-\uD87E\uD880-\uD8BE\uD8C0-\uD8FE\uD900-\uD93E\uD940-\uD97E\uD980-\uD9BE\uD9C0-\uD9FE\uDA00-\uDA3E\uDA40-\uDA7E\uDA80-\uDABE\uDAC0-\uDAFE\uDB00-\uDB3E\uDB44-\uDB7E][\uDC00-\uDFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F][\uDC00-\uDFFD])*@)?(?:\[(?:(?:(?:[0-9a-f]{1,4}:){6}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|::(?:[0-9a-f]{1,4}:){5}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:[0-9a-f]{1,4}:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|v[0-9a-f]+[-a-z0-9\._~!\$&'\(\)\*\+,;=:]+)\]|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3}|(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~!\$&'\(\)\*\+,;=@\xA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[\uD800-\uD83E\uD840-\uD87E\uD880-\uD8BE\uD8C0-\uD8FE\uD900-\uD93E\uD940-\uD97E\uD980-\uD9BE\uD9C0-\uD9FE\uDA00-\uDA3E\uDA40-\uDA7E\uDA80-\uDABE\uDAC0-\uDAFE\uDB00-\uDB3E\uDB44-\uDB7E][\uDC00-\uDFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F][\uDC00-\uDFFD])*)(?::[0-9]*)?(?:\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~!\$&'\(\)\*\+,;=:@\xA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[\uD800-\uD83E\uD840-\uD87E\uD880-\uD8BE\uD8C0-\uD8FE\uD900-\uD93E\uD940-\uD97E\uD980-\uD9BE\uD9C0-\uD9FE\uDA00-\uDA3E\uDA40-\uDA7E\uDA80-\uDABE\uDAC0-\uDAFE\uDB00-\uDB3E\uDB44-\uDB7E][\uDC00-\uDFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F][\uDC00-\uDFFD]))*)*|\/(?:(?:(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~!\$&'\(\)\*\+,;=:@\xA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[\uD800-\uD83E\uD840-\uD87E\uD880-\uD8BE\uD8C0-\uD8FE\uD900-\uD93E\uD940-\uD97E\uD980-\uD9BE\uD9C0-\uD9FE\uDA00-\uDA3E\uDA40-\uDA7E\uDA80-\uDABE\uDAC0-\uDAFE\uDB00-\uDB3E\uDB44-\uDB7E][\uDC00-\uDFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F][\uDC00-\uDFFD]))+)(?:\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~!\$&'\(\)\*\+,;=:@\xA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[\uD800-\uD83E\uD840-\uD87E\uD880-\uD8BE\uD8C0-\uD8FE\uD900-\uD93E\uD940-\uD97E\uD980-\uD9BE\uD9C0-\uD9FE\uDA00-\uDA3E\uDA40-\uDA7E\uDA80-\uDABE\uDAC0-\uDAFE\uDB00-\uDB3E\uDB44-\uDB7E][\uDC00-\uDFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F][\uDC00-\uDFFD]))*)*)?|(?:(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~!\$&'\(\)\*\+,;=:@\xA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[\uD800-\uD83E\uD840-\uD87E\uD880-\uD8BE\uD8C0-\uD8FE\uD900-\uD93E\uD940-\uD97E\uD980-\uD9BE\uD9C0-\uD9FE\uDA00-\uDA3E\uDA40-\uDA7E\uDA80-\uDABE\uDAC0-\uDAFE\uDB00-\uDB3E\uDB44-\uDB7E][\uDC00-\uDFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F][\uDC00-\uDFFD]))+)(?:\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~!\$&'\(\)\*\+,;=:@\xA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[\uD800-\uD83E\uD840-\uD87E\uD880-\uD8BE\uD8C0-\uD8FE\uD900-\uD93E\uD940-\uD97E\uD980-\uD9BE\uD9C0-\uD9FE\uDA00-\uDA3E\uDA40-\uDA7E\uDA80-\uDABE\uDAC0-\uDAFE\uDB00-\uDB3E\uDB44-\uDB7E][\uDC00-\uDFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F][\uDC00-\uDFFD]))*)*|(?!(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~!\$&'\(\)\*\+,;=:@\xA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[\uD800-\uD83E\uD840-\uD87E\uD880-\uD8BE\uD8C0-\uD8FE\uD900-\uD93E\uD940-\uD97E\uD980-\uD9BE\uD9C0-\uD9FE\uDA00-\uDA3E\uDA40-\uDA7E\uDA80-\uDABE\uDAC0-\uDAFE\uDB00-\uDB3E\uDB44-\uDB7E][\uDC00-\uDFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F][\uDC00-\uDFFD])))(?:\?(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~!\$&'\(\)\*\+,;=:@\/\?\xA0-\uD7FF\uE000-\uFDCF\uFDF0-\uFFEF]|[\uD800-\uD83E\uD840-\uD87E\uD880-\uD8BE\uD8C0-\uD8FE\uD900-\uD93E\uD940-\uD97E\uD980-\uD9BE\uD9C0-\uD9FE\uDA00-\uDA3E\uDA40-\uDA7E\uDA80-\uDABE\uDAC0-\uDAFE\uDB00-\uDB3E\uDB44-\uDB7E\uDB80-\uDBBE\uDBC0-\uDBFE][\uDC00-\uDFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDC00-\uDFFD])*)?(?:\#(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~!\$&'\(\)\*\+,;=:@\/\?\xA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[\uD800-\uD83E\uD840-\uD87E\uD880-\uD8BE\uD8C0-\uD8FE\uD900-\uD93E\uD940-\uD97E\uD980-\uD9BE\uD9C0-\uD9FE\uDA00-\uDA3E\uDA40-\uDA7E\uDA80-\uDABE\uDAC0-\uDAFE\uDB00-\uDB3E\uDB44-\uDB7E][\uDC00-\uDFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F][\uDC00-\uDFFD])*)?$/i;
/* tslint:disable-next-line */
export type UrlGenerator = ((attempt: number, ws: Waterfall) => string) | ((attempt: number, ws: Waterfall) => Promise<string>);
/**
 * The Waterfall provide a Websocket that will try to reconnect automatically according to the policy
 */
export class Waterfall extends Shell {

    private timeout: any;
    private connectionTimeout: number = 5000;
    private emitClose: boolean = false;
    private retryPolicy: (attempt: number, ws: Waterfall) => number = exponentialTruncatedBackoff();
    private _urlGenerator: UrlGenerator;
    private _url: string;
    private attempts: number = -1;

    /**
     *
     * @param {string | (attempt: number, ws: Waterfall) => string} url
     * @param {string | string[]} protocols
     * @param {IWaterfallOptions} options
     */
    public constructor(
        url: string | UrlGenerator,
        private protocols?: string | string[],
        private options?: IWaterfallOptions) {
        super();
        if (!url) {
            throw new TypeError("Invalid url");
        }
        this.urlGenerator = url;
        if (options) {
            this.connectionTimeout = options.connectionTimeout || this.connectionTimeout;
            this.emitClose = options.emitClose || this.emitClose;
            this.retryPolicy = options.retryPolicy || this.retryPolicy;
        }
        this.reconnect();
    }

    /**
     * The URL as resolved by the constructor. This is always an absolute URL.
     */
    public get url(): string {
        return this._url;
    }

    /**
     * Change the url
     */
    public set url(value: string) {
        this.urlGenerator = value;
        if (this._url !== value) {
            this._url = value;
            if (this.ws) {
                this.ws.close(1000);
            }
        }
    }

    /**
     * Reset the connection (close/open)
     */
    public reset() {
        if (this.ws) {
            this.ws.close(1000);
        }
    }

    /**
     * The current state of the connection; this is one of the Ready state constants. **Read only.**
     */
    public get readyState(): number {
        return this._readyState;
    }

    /**
     * The number of bytes of data that have been queued using calls to _send()_ but not yet transmitted to the network.
     * This value resets to zero once all queued data has been sent. This value does not reset to zero when the
     * connection is closed; if you keep calling _send()_, this will continue to climb. **Read only**
     */
    public get bufferedAmount(): number {
        return this.ws.bufferedAmount;
    }

    /**
     * The extensions selected by the server. This is currently only the empty string or a list
     * of extensions as negotiated by the connection.
     */
    public get extensions(): string {
        // https://github.com/websockets/ws/issues/1244
        return typeof (this.ws.extensions) === "string" ? this.ws.extensions : "";
    }

    public get protocol(): string {
        return this.ws.protocol;
    }

    /**
     * Closes the WebSocket connection or connection attempt, if any.
     * If the connection is already CLOSED, this method does nothing.
     * @param {number} A numeric value indicating the status code explaining why the connection is being closed.
     * If this parameter is not specified, a default value of 1005 is assumed.
     * See the list of status codes https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes
     * on the CloseEvent page for permitted values.
     * @param {string} A human-readable string explaining why the connection is closing.
     * This string must be no longer than 123 bytes of UTF-8 text (not characters).
     */
    public close(code: number = 1000, reason?: string) {
        if (this.closing) {
            return;
        }
        this.closing = true;
        clearTimeout(this.timeout);
        if ( this.ws) {
        this.ws.close(  code, reason);
        }
    }

    private set urlGenerator(value: string | UrlGenerator) {
        if (typeof value === "string") {
            if (!value.match(REGEXP_URL)) {
                throw new TypeError("Invalid url");
            }
            this._urlGenerator = () => value;
        } else {
            this._urlGenerator = value;
        }
    }

    private webSocketFactory(): WebSocket {
        return this.options && this.options.factory
            ? this.options.factory(this.url, this.protocols || [])
            : new WebSocket(this.url, this.protocols || []);

    }

    private onOpenWebSocket(evt: Event) {
        this.attempts = -1;
        clearTimeout(this.timeout);
        this._readyState = WebSocket.OPEN;
        this.dispatchEvent(evt);
    }

    private reconnect(timeout?: number) {
        this._readyState = WebSocket.CONNECTING;
        this.dispatchEvent(new CustomEvent("connecting", { detail: timeout }));
        if (timeout !== void 0) {
            setTimeout(() => this.open(), timeout);
        } else {
            this.open();
        }
    }

    private onCloseWebSocket(evt: CloseEvent) {
        clearTimeout(this.timeout);
        if (this.closing) {
            this._readyState = WebSocket.CLOSED;
            this.dispatchEvent(evt);
            return;
        }
        const timeout = this.retryPolicy(this.attempts + 1, this);
        if (timeout === null) {
            this._readyState = WebSocket.CLOSED;
            this.dispatchEvent(evt);
        } else if (this.emitClose) {
            this._readyState = WebSocket.CLOSED;
            this.dispatchEvent(evt);
            this.reconnect(timeout);
        } else {
            this.reconnect(timeout);
        }
    }

    private unbindWebSocket() {
        if (this.ws) {
            this.ws.onopen = null;
            this.ws.onclose = null;
            this.ws.onmessage = null;
            this.ws.onerror = null;
        }
    }

    private bindWebSocket() {
        this.ws.onopen = this.onOpenWebSocket.bind(this);
        this.ws.onclose = this.onCloseWebSocket.bind(this);
        this.ws.onmessage = this.dispatchEvent.bind(this);
        this.ws.onerror = this.dispatchEvent.bind(this);
    }

    private forceClose(silent: boolean = false): void {
        try {
            if (silent) {
                this.unbindWebSocket();
            }
            this.ws.close();
        } catch {
            // ignore
        }
    }

    private failed(): void {
        clearTimeout(this.timeout);
        this.forceClose(true);
        const timeout = this.retryPolicy(this.attempts + 1, this);
        if (timeout === null) {
            this._readyState = WebSocket.CLOSED;
            this.dispatchEvent(new CloseEvent("close", { code: 4000, reason: "Connect timeout" }));
        } else {
            setTimeout(() => this.open(), timeout);
        }
    }

    private setupWebSocketTimeout(): void {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.failed();
        }, this.connectionTimeout);
    }

    private open() {
        if (this.closing) {
            return;
        }

        const doOpen = (url: string) => {
            this._url = url;
            this.forceClose(true);
            try {
                this.ws = this.webSocketFactory();
                (this.ws as any).binaryType = this.binaryType || this.ws.binaryType;
                this.setupWebSocketTimeout();
                this.bindWebSocket();
            } catch (e) {
                this.failed();
            }
        };

        this.attempts++;
        const urlOrPromise: any = this._urlGenerator(this.attempts, this);
        urlOrPromise.then ? urlOrPromise.then(doOpen) : doOpen(urlOrPromise);
    }

}
