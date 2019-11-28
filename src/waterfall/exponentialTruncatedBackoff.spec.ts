import { expect } from "chai";
import {exponentialTruncatedBackoff} from "./exponentialTruncatedBackoff";

describe("exponentialTruncatedBackoff", () => {
    const slotTime = 100;
    const repeat = 1000;
    it("should have the expected mean after many iterations", () => {
        const etb = exponentialTruncatedBackoff(slotTime);
        let sum = 0;
        for (let i = 0; i < repeat; i++) {
            const value = etb(3, null);
            expect(value).to.be.at.most(slotTime * 7);
            sum += value;
        }
        const mean = sum / repeat;
        expect(mean).to.be.closeTo(3.5 * slotTime, 0.2 * slotTime);
    }).retries(5);

    it("should truncate", () => {
        const etb = exponentialTruncatedBackoff(slotTime, 3);
        let sum = 0;
        for (let i = 0; i < repeat; i++) {
            const value = etb(i, null);
            expect(value).to.be.at.most(slotTime * 7);
            sum += value;
        }
        const mean = sum / repeat;
        expect(mean).to.be.closeTo(3.5 * slotTime, 0.2 * slotTime);
    }).retries(5);
});
