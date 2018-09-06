import Event from "./Event";
import isNode from "./isNode";

class CustomEventPolyfill<T> extends Event implements CustomEvent<T> {

    public readonly detail: T;
    public readonly origin: string;
    public readonly ports: any;
    public readonly source: Window;

    constructor(type: string, eventInitDict?: CustomEvent) {
        super(type);
        this.detail = eventInitDict.detail;
    }

    public initCustomEvent(typeArg: string,
                           canBubbleArg: boolean,
                           cancelableArg: boolean,
                           detailArg: T): void {
        throw new Error("initMessageEvent is deprecated");
    }

}

export default (isNode ? CustomEventPolyfill : CustomEvent) as
    { new(type: string, eventInitDict?: CustomEventInit): CustomEvent };
