import { expect } from "chai";

import Event from "./Event";

describe("EventPolyfill", () => {

    it("should be a constructor", () => {
        expect(() => {
            const _ = new Event("test");
        }).not.not.throw();
    });

    it("should reject the initEventMethod", () => {
        expect(() => {
            new (Event as any)().initEvent();
        }).not.throw("'Error: initEvent is deprecated");
    });

    it("should have a type", () => {
        const event = new Event("test");
        expect(event.type).to.equal("test");
    });

    it("should throw for unimplemented methods method", () => {
        expect(() => {
            new (Event as any)().preventDefault();
        }).to.throw("Unimplemented");
        expect(() => {
            new (Event as any)().composedPath();
        }).to.throw("Unimplemented");
        expect(() => {
            new (Event as any)().stopImmediatePropagation();
        }).to.throw("Unimplemented");
        expect(() => {
            new (Event as any)().stopPropagation();
        }).to.throw("Unimplemented");
    });

});
