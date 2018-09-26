import CloseEvent from "../polyfill/CloseEvent";
import Event from "../polyfill/Event";
import WebSocket from "../polyfill/WebSocket";
import { Shell } from "../Shell";

export class RoutedWebSocket extends Shell {

    /** The connection is not yet open. */
    public readonly CONNECTING = WebSocket.CONNECTING;
    /**  The connection is open and ready to communicate. */
    public readonly OPEN = WebSocket.OPEN;
    /**  The connection is in the process of closing. */
    public readonly CLOSING = WebSocket.CLOSING;
    /**  The connection is closed or couldn't be opened. */
    public readonly CLOSED = WebSocket.CLOSED;

    private virtualReadyState: number = null;

    constructor(
        private readonly routerSend: (data: USVString | ArrayBuffer | Blob | ArrayBufferView) => void,
        private readonly routerClose: (code: number, reason: string) => void,
    ) {
        super();
    }

    public setReadyState(state: number) {
        if (this.virtualReadyState === state) {
            return;
        }
        this.virtualReadyState = state;
        switch (state) {
            case this.OPEN:
                this.dispatchEvent(new Event("open"));
                break;
            case this.CLOSED:
                this.dispatchEvent(new CloseEvent("close"));
                break;
            default:
                break;
        }
    }

    public send(data: USVString | ArrayBuffer | Blob | ArrayBufferView): void {
        this.routerSend(data);
    }

    public get url(): string {
        return "";
    }

    public get bufferedAmount(): number {
        return 0;
    }

    public get extensions(): string {
        return "";
    }

    public get protocol(): string {
        return "";
    }

    public close(code: number = 1000, reason?: string) {
        this.virtualReadyState = this.CLOSED;
        this.routerClose(code, reason);
    }

    protected getReadyState(): number {
        return this.virtualReadyState === null ? WebSocket.CONNECTING : this.virtualReadyState;
    }
}
