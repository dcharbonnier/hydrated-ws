import {expect} from "chai";
import {polyfill} from "./ArrayFind";

// Force the polyfill of Array.find
polyfill(true);
describe("Array.find", () => {
    it("should find an object in an array by one of its properties", () => {
        const inventory = [
            {name: "apples", quantity: 2},
            {name: "bananas", quantity: 0},
            {name: "cherries", quantity: 5},
        ];

        const isCherries = (fruit: any) => fruit.name === "cherries";

        expect(inventory.find(isCherries)).to.deep.equal({name: "cherries", quantity: 5});
    });

    it("should stop as soon had the element is found", () => {
        const inventory = [
            {name: "apples", quantity: 2},
            {name: "bananas", quantity: 0},
            {name: "cherries", quantity: 5},
        ];
        let i = 0;

        const isCherries = (fruit: any) => {
            i++;
            return fruit.name === "bananas";
        };
        inventory.find(isCherries);
        expect(i).to.equal(2);
    });

    it("should accept an empty array", () => {
        const inventory = [];

        const isCherries = (fruit: any) => fruit.name === "cherries";

        expect(inventory.find(isCherries)).to.equal(void 0);
    });

    it("should return undefined if not found", () => {
        const inventory = [];
        const isCherries = (fruit: any) => fruit.name === "tomatoes";
        expect(inventory.find(isCherries)).to.equal(void 0);
    });

    it("should find a prime number in an array", () => {
        // Declare array with no element at index 2, 3 and 4
        const array = [0, 1, , , , 5, 6];
        const logs = [];

        // Shows all indexes, including deleted
        array.find((value, index) => {

            // Delete element 5 on first iteration
            if (index === 0) {
                logs.push("Deleting array[5] with value " + array[5]);
                delete array[5];
            }
            // Element 5 is still visited even though deleted
            logs.push("Visited index " + index + " with value " + value);
        });
        expect(logs).to.deep.equal([
            "Deleting array[5] with value 5",
            "Visited index 0 with value 0",
            "Visited index 1 with value 1",
            "Visited index 2 with value undefined",
            "Visited index 3 with value undefined",
            "Visited index 4 with value undefined",
            "Visited index 5 with value undefined",
            "Visited index 6 with value 6",
        ]);
    });
});
