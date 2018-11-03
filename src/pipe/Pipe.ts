import CloseEvent from "../polyfill/CloseEvent";
import Event from "../polyfill/Event";
import MessageEvent from "../polyfill/MessageEvent";
import WebSocket from "../polyfill/WebSocket";
import { Shell } from "../Shell";

/**
 * The Pipe create a simple multiplexing for string messages
 *
 * @example
 * ```typescript
 *
 * Client 1
 * const pipeA = new Pipe(ws, "A");
 * pipeA.send("message sent on pipe A")
 * const pipeB = new Pipe(ws, "B");
 *
 * Client 2
 * const pipeA = new Pipe(ws, "A");
 * pipeA.on("message", (str)=> console.log(`received ${str} on pipeA`)
 * const pipeB = new Pipe(ws, "B");
 * pipeB.on("message", (str)=> console.log(`received ${str} on pipeB`)
 * ```
 */

export class Pipe extends Shell {

    private static repeatString(str: string, count: number): string {
        let res = "";
        for (let i = count; i > 0; i--) {
            res += str;
        }
        return res;
    }

    private readonly channel: string;
    private pipeReadyState: number = null;

    /**
     * @param {} ws
     * @param {string} a string used to mark the messages channel, transparent for the user
     * @param {number} the maximum prefix length, should be as short as possible and
     *                 identical for all pipes on a WebSocket, default to 4
     */
    constructor(ws: WebSocket, channel: string, private readonly prefixLength: number = 4) {
        super();

        if (typeof (channel) !== "string" || !channel.length || channel.length > this.prefixLength) {
            throw new Error(`Channel should be a string between 1 and ${this.prefixLength} characters`);
        }
        this.channel = `${Pipe.repeatString(" ", this.prefixLength)}${channel}`.slice(this.prefixLength * -1);
        this.ws = ws;
        this.forwardEvents();
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
        if (this.pipeReadyState) {
            return;
        }
        this.stopForwardingEvents();
        this.pipeReadyState = this.CLOSING;
        setTimeout(() => {
            this.pipeReadyState = this.CLOSED;
            this.dispatchEvent(new CloseEvent("close", { code, reason, wasClean: true }));
        }, 0);
    }

    /**
     * Send a message through the pipe, unlike regular _send_ method, a pipe only accept string messages
     * @param {string} data
     */
    public send(data: string) {
        if (this.pipeReadyState) {
            return;
        }
        if (typeof (data) !== "string") {
            throw new Error(`Pipe only support sending string, you passed a type ${typeof (data)}`);
        }
        super.send(this.channel + data);
    }

    /**
     * Dispatch an event to this EventTarget.
     * @param {} The Event object to be dispatched.
     * @returns {boolean} The return value is **false** if event is cancelable and at least one of the event
     * handlers which handled this event called Event.preventDefault(). Otherwise it returns true.
     */
    public dispatchEvent(evt: Event): any {
        if (evt.type === "message") {
            const e: MessageEvent = evt as any;
            // Older TS versions did not have proper typings for MessageEvent.source, but
            // MessageEventSource is not available in TS < 3
            // https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent#Properties
            const eventSource = e.source as Window;
            if (typeof (e.data) === "string" && this.channel === e.data.substr(0, this.prefixLength)) {
                super.dispatchEvent(new MessageEvent("message", {
                    data: e.data.substr(this.prefixLength),
                    origin: e.origin,
                    ports: e.ports as any,
                    source: eventSource,
                }));
                return false;
            }
        } else {
            super.dispatchEvent(evt);
        }
    }

    protected getReadyState() {
        return this.pipeReadyState || super.getReadyState();
    }
}
