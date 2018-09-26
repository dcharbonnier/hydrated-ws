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

    it("should return an empty deepPath", () => {
        const event = new Event("test");
        expect(event.deepPath()).to.deep.equal([]);
    });

});
