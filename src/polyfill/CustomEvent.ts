import Event from "./Event";
import isNode from "./isNode";

class CustomEventPolyfill<T> extends Event implements CustomEvent<T> {

    public readonly detail: T;

    constructor(type: string, eventInitDict?: CustomEventInit<T>) {
        super(type);
        eventInitDict = eventInitDict || {};
        this.detail = eventInitDict.detail;
    }

    public initCustomEvent(typeArg: string,
                           canBubbleArg: boolean,
                           cancelableArg: boolean,
                           detailArg: T): void {
        throw new Error("initCustomEvent is deprecated");
    }

}

export default (isNode ? CustomEventPolyfill : CustomEvent) as
    { new(type: string, eventInitDict?: CustomEventInit): CustomEvent };
