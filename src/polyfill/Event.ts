import isNode from "./isNode";

class EventPolyfill implements Event {

    public static NONE: 0;
    public static CAPTURING_PHASE: 1;
    public static AT_TARGET: 2;
    public static BUBBLING_PHASE: 3;

    public readonly NONE: 0;
    public readonly CAPTURING_PHASE: 1;
    public readonly AT_TARGET: 2;
    public readonly BUBBLING_PHASE: 3;
    public readonly bubbles: boolean;
    public readonly cancelable: boolean;
    public readonly cancelBubble: boolean;
    public readonly currentTarget: EventTarget;
    public defaultPrevented: boolean;
    public readonly eventPhase: number;
    public readonly isTrusted: boolean;
    public returnValue: boolean;
    public readonly srcElement: Element | null;
    public readonly target: EventTarget;
    public readonly timeStamp: number;
    public readonly scoped: boolean;
    public readonly type: string;
    public readonly composed: boolean = false;

    constructor(type: string) {
        this.type = type;
    }

    public initEvent(eventTypeArg: string, canBubbleArg: boolean, cancelableArg: boolean): void {
        throw new Error("initEvent is deprecated");
    }

    public preventDefault(): void {
        // unimplemented
    }

    public composedPath(): EventTarget[] {
        return [];
    }

    public stopImmediatePropagation(): void {
        // unimplemented
    }

    public stopPropagation(): void {
        // unimplemented
    }

}

export default ((isNode ? EventPolyfill : Event) as any) as { new(type: string): Event };
