import { expect } from "chai";

import { Dict } from "./Dict";

describe("Dict", () => {

    it("should be a constructor", () => {
        expect(() => {
            const _ = new Dict();
        }).not.not.throw();
    });

    describe("String key", () => {
        it("should add a value", () => {
            const dict = new Dict();
            dict.set("test","value");
            expect(dict.has("test")).to.equal(true);
        });
        it("should set a value", () => {
            const dict = new Dict();
            dict.set("test","value");
            expect(dict.get("test")).to.equal("value");
            expect(dict.has("test")).to.equal(true);
        });
        it("should overwrite a value", () => {
            const dict = new Dict();
            dict.set("test","value");
            dict.set("test","value2");
            expect(dict.get("test")).to.equal("value2");
        });
        it("should delete a value", () => {
            const dict = new Dict();
            dict.set("test","value");
            dict.delete("test");
            expect(dict.has("test")).to.equal(false);
        });
        it("should clear all the values", () => {
            const dict = new Dict();
            dict.set("test","value");
            dict.clear();
            expect(dict.has("test")).to.equal(false);
        });
        it("should return the keys", () => {
            const dict = new Dict();
            dict.set("test","value");
            dict.set("test2","value");
            expect(dict.keys()).to.deep.equal(["test","test2"]);
        });
        it("should return the values", () => {
            const dict = new Dict();
            dict.set("test","value");
            dict.set("test2","value");
            expect(dict.values()).to.deep.equal(["value","value"]);
        });
    });

    [null, void 0].forEach((k) => {
        describe(`${k} key`, () => {
            it("should ignore the add", () => {
                const dict = new Dict();
                dict.set(k,"value");
                expect(dict.size()).to.equal(0);
            });
            it("should return undefined on get", () => {
                const dict = new Dict();
                expect(dict.get(k)).to.equal(void 0);
            });
            it("should ignore a delete", () => {
                const dict = new Dict();
                expect(() => dict.delete(k)).to.not.throw();
            });
            it("should return false for a 'has'", () => {
                const dict = new Dict();
                expect(dict.has(k)).to.equal(false);
            });
    });


    });
});
