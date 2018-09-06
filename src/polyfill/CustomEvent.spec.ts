import { expect } from "chai";

import CustomEvent from "./CustomEvent";

describe("CustomEventPolyfill", () => {

    it("should be a constructor", () => {
        expect(() => {
            new CustomEvent("test");
        }).not.not.throw();
    });

    it("should keep the detail value", () => {
        const ev = new CustomEvent("test", { detail: "value" });
        expect(ev.detail).to.equal("value");
    });

});
