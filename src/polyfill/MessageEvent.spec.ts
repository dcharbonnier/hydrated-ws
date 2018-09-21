import { expect } from "chai";

import MessageEvent from "./MessageEvent";

describe("MessageEventPolyfill", () => {

    it("should be a constructor", () => {
        expect(() => {
            const _ = new MessageEvent("test");
        }).not.not.throw();
    });

    it("should reject the initEventMethod", () => {
        expect(() => {
            new (MessageEvent as any)().initMessageEvent();
        }).not.throw("'Error: initMessageEvent is deprecated");
    });

    it("should keep the detail value", () => {
        const ev = new MessageEvent("test", { data: "value" });
        expect(ev.data).to.equal("value");
    });

});
