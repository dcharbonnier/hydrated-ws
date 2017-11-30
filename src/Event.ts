import isNode from "./isNode";

class EventPolyfill implements Event {

    public static CAPTURING_PHASE: 1;
    public static AT_TARGET: 2;
    public static BUBBLING_PHASE: 3;

    public readonly CAPTURING_PHASE: 1;
    public readonly AT_TARGET: 2;
    public readonly BUBBLING_PHASE: 3;
    public readonly bubbles: boolean;
    public readonly cancelable: boolean;
    public readonly cancelBubble: boolean;
    public readonly currentTarget: EventTarget;
    public readonly defaultPrevented: boolean;
    public readonly eventPhase: number;
    public readonly isTrusted: boolean;
    public returnValue: boolean;
    public readonly srcElement: Element | null;
    public readonly target: EventTarget;
    public readonly timeStamp: number;
    public readonly scoped: boolean;
    public readonly type: string

    constructor(type: string) {
        this.type = type;
    }

    public initEvent(eventTypeArg: string, canBubbleArg: boolean, cancelableArg: boolean): void {
        throw new Error("initEvent is deprecated");
    }

    public preventDefault(): void {

    }

    public stopImmediatePropagation(): void {

    }

    public stopPropagation(): void {

    }

    public deepPath(): EventTarget[] {
        return [];
    }

}

export default (<any>(isNode ? EventPolyfill : Event)) as { new(type: string): Event };