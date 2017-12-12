
let rnd = Math.random() * 16 | 0;

if (typeof crypto !== "undefined") {
    rnd = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
}
export const uuid = () => ([1e7] + -1e3 + -4e3 + -8e3 + -1e11)
    .replace(/[018]/g, (c) => (c ^ Math.random() * 16 >> c / 4).toString(16));
