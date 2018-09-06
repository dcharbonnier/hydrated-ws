import { expect } from "chai";

import CustomEvent from "./CustomEvent";

describe("CustomEventPolyfill", () => {

    it("should be a constructor", () => {
        expect(() => {
            const _ = new CustomEvent("test");
        }).not.not.throw();
    });

    it("should reject the initEventMethod", () => {
        expect(() => {
            new (CustomEvent as any)().initCustomEvent();
        }).not.throw("'Error: initCustomEvent is deprecated");
    });

    it("should keep the detail value", () => {
        const ev = new CustomEvent("test", { detail: "value" });
        expect(ev.detail).to.equal("value");
    });

});
