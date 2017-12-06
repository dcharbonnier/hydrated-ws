import {expect} from "chai";
import {uuid} from "./uuid";

describe("uuid", () => {
    it("should return a string that looks like an uuid4", () => {
        expect(uuid()).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
});
