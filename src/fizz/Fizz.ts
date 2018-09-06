import { EventEmitter } from "events";
import { Shell } from "../Shell";

export class Fizz extends Shell implements EventEmitter {

    public addListener(event: string | symbol, listener: (...args: any[]) => void): this {
        switch (event) {
            case "close":
                this.addEventListener("close", (evt: CloseEvent) => listener(evt.code, evt.reason));
                break;
            case "error":
                this.addEventListener("error", (evt: ErrorEvent) => listener(evt.error));
                break;
            case "message":
                this.addEventListener("message", (evt: MessageEvent) => listener(evt.data));
                break;
            case "open":
                this.addEventListener("open", () => listener());
                break;
            default:
                console.log("not impelmented");
        }
        return this;
    }

    public on(event: string | symbol, listener: (...args: any[]) => void): this {
        return this.addListener(event, listener);
    }

    public once(event: string | symbol, listener: (...args: any[]) => void): this {
        return this.addListener(event, listener);
    }

    public prependListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return this.addListener(event, listener);
    }

    public prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return this.addListener(event, listener);
    }

    public removeListener(event: string | symbol, listener: (...args: any[]) => void): this {
        super.removeEventListener(event as any, listener);
        return this;
    }

    public off(event: string | symbol, listener: (...args: any[]) => void): this {
        return this.removeListener(event, listener);
    }

    public removeAllListeners(event?: string | symbol): this {
        for (const key of this.listenersDict.keys()) {
            this.listenersDict.get(key).length = 0;
        }
        return this;
    }

    public setMaxListeners(n: number): this {
        return this;
    }

    public getMaxListeners(): number {
        return 0;
    }

    public listeners(event: string | symbol): Array<() => void> {
        return [];
    }

    public rawListeners(event: string | symbol): Array<() => void> {
        return [];

    }

    public emit(event: string | symbol, ...args: any[]): boolean {
        // return this.dispatchEvent(event, args);
        return true;
    }

    public eventNames(): Array<string | symbol> {
        return this.listenersDict.keys();
    }

    public listenerCount(type: string | symbol): number {
        return this.listenersDict[type] ? this.listenersDict[type].length : 0;
    }
}
