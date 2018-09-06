import Event from "./Event";
import isNode from "./isNode";

class CustomEventPolyfill<T> extends Event implements CustomEvent<T> {

    public readonly detail: T;

    constructor(type: string, eventInitDict?: CustomEvent) {
        super(type);
        this.detail = eventInitDict ? eventInitDict.detail : null;
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
