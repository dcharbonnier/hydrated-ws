import Event from "./Event";
import isNode from "./isNode";

class CloseEventPolyfill extends Event implements CloseEvent {

    public readonly code: number;
    public readonly reason: string;
    public readonly wasClean: boolean;

    constructor(typeArg: string, eventInitDict?: CloseEventInit) {
        super(typeArg);
        eventInitDict = eventInitDict || {};
        this.code = eventInitDict.code;
        this.reason = eventInitDict.reason;
        this.wasClean = eventInitDict.wasClean;
    }

    public initCloseEvent(typeArg: string,
                          canBubbleArg: boolean,
                          cancelableArg: boolean,
                          wasCleanArg: boolean,
                          codeArg: number,
                          reasonArg: string): void {
                              throw new Error("initCloseEvent is deprecated");

    }

}

export default (isNode ? CloseEventPolyfill : CloseEvent) as
    new(type: string, eventInitDict?: CloseEventInit) => CloseEvent;
