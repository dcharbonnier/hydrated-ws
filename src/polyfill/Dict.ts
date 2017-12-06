export class Dict<K extends string, T> {

    private values: { [key: string]: T } = {};

    public get(key: K): T {
        return this.values[key];
    }

    public set(key: K, value: T) {
        this.values[key] = value;
    }

    public has(key: K) {
        return this.values[key] !== void 0;
    }

    public delete(key: K) {
        delete this.values[key];
    }
    public keys() {
        return Object.keys(this.values);
    }
}
