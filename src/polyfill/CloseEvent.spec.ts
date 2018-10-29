import { expect } from "chai";

import CloseEvent from "./CloseEvent";

describe("CloseEventPolyfill", () => {

    it("should be a constructor", () => {
        expect(() => {
            const _ = new CloseEvent("close", {});
        }).not.not.throw();
    });

    it("should reject the initCloseEvent", () => {
        expect(() => {
            new (CloseEvent as any)().initCloseEvent();
        }).not.throw("'Error: initCloseEvent is deprecated");
    });

    it("should keep the code value", () => {
        const ev = new CloseEvent("test", { code: 1000 });
        expect(ev.code).to.equal(1000);
    });

    it("should keep the reason value", () => {
        const ev = new CloseEvent("test", { reason: "test" });
        expect(ev.reason).to.equal("test");
    });

});
