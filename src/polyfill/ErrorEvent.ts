import Event from "./Event";
import isNode from "./isNode";

class ErrorEventPolyfill extends Event implements ErrorEvent {

    public readonly colno: number;
    public readonly error: any;
    public readonly filename: string;
    public readonly lineno: number;
    public readonly message: string;

    public readonly data: any;
    public readonly origin: string;
    public readonly ports: any;
    public readonly source: Window;

    constructor(type: string, eventInitDict?: ErrorEventInit) {
        super(type);
        this.error = eventInitDict.error;
        if (this.error) {
            this.message = this.error.message;
        }
    }

    public initErrorEvent(typeArg: string,
                          canBubbleArg: boolean,
                          cancelableArg: boolean,
                          messageArg: string,
                          filenameArg: string,
                          linenoArg: number): void {
        throw new Error("initErrorEvent is deprecated");
    }

}

export default (isNode ? ErrorEventPolyfill : ErrorEvent) as
    { new(type: string, eventInitDict?: ErrorEventInit): ErrorEvent };
