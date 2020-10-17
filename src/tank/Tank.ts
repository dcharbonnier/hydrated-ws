import WebSocket from "../polyfill/WebSocket";
import {Shell} from "../Shell";

/**
 * The Tank allow you to send message without checking the state of the connection, the messages will be delayed until
 * the connection is open.
 */
export class Tank extends Shell {

    private buffer: any[] = [];
    private flushInterval: NodeJS.Timeout | number;

    constructor(ws: WebSocket) {
        super();
        this.ws = ws;
        this.forwardEvents();
        this.addEventListener("open", () => this.flush());
        // @todo
        // The tank do not send twice an open event so the readyState can
        // change without an open or close event
        // detect this is a tank, add a readyState change event
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
        this.stopFlushInterval();
        super.close(code, reason);
    }

    /**
     * Unlike the regular _send_ command of a WebSocket the messages are stored until the connection is **OPEN** and
     * will
     * be flushed automatically
     * @param data The data to send to the server. It may be one of the following types:
     * - **USVString**
     * A text string. The string is added to the buffer in UTF-8 format, and the value of bufferedAmount is increased
     * by the number of bytes required to represent the UTF-8 string.
     * - **ArrayBuffer**
     * You can send the underlying binary data used by a typed array object; its binary data contents are queued in
     * the buffer, increasing the value of bufferedAmount by the requisite number of bytes.
     * - **Blob**
     * Specifying a Blob enqueues the blob's raw data to be transmitted in a binary frame. The value of bufferedAmount
     * is increased by the byte size of that raw data.
     * - **ArrayBufferView**
     * You can send any JavaScript typed array object as a binary frame; its binary data contents are queued in the
     * buffer, increasing the value of bufferedAmount by the requisite number of bytes.
     */
    public send(data: string| ArrayBuffer | Blob | ArrayBufferView) {
        if (!data) { return; }
        this.buffer.unshift(data);
        this.flush();
    }

    private startFlushInterval() {
        if (!this.flushInterval) {
            this.flushInterval = setInterval(() => this.flush(), 100);
        }
    }

    private stopFlushInterval() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval as any);
        }
        this.flushInterval = null;
    }

    private flush() {
        if (this.ws.readyState === this.OPEN) {
            let data: any;
            while (data = this.buffer.pop()) { // tslint:disable-line:no-conditional-assignment
                this.ws.send(data);
            }
            this.stopFlushInterval();
        } else {
            this.startFlushInterval();
        }
    }

}
