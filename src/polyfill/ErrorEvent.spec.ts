import { expect } from "chai";

import ErrorEvent from "./ErrorEvent";

describe("ErrorEventPolyfill", () => {

    it("should be a constructor", () => {
        expect(() => {
            const _ = new ErrorEvent("close", {});
        }).not.not.throw();
    });

    it("should reject the initErrorEvent", () => {
        expect(() => {
            new (ErrorEvent as any)().initErrorEvent();
        }).not.throw("'Error: initErrorEvent is deprecated");
    });

    it("should keep the error value", () => {
        const error =  new Error("test");
        const ev = new ErrorEvent("close", {error});
        expect(ev.error).to.equal(error);
        expect(ev.message).to.equal("test");
    });

});
