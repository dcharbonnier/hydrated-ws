
let rnd = Math.random() * 16 | 0;

let crypto: any = void 0;
if (typeof window !== "undefined") {
    crypto = window ? window.crypto || (window as any).msCrypto : void 0;
}

if (typeof crypto === "object" && typeof crypto.getRandomValues === "function") {
    rnd = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
}
export const uuid = () => (`${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`)
    .replace(/[018]/g, (c: any) => (c ^ Math.random() * 16 >> c / 4).toString(16));
