export class Dict<K extends string, T> {

    private data: { [key: string]: T } = {};

    public get(key: K): T {
        return this.data[key];
    }

    public clear() {
        return this.data = {};
    }

    public set(key: K, value: T) {
        this.data[key] = value;
    }

    public has(key: K) {
        return this.data[key] !== void 0;
    }

    public delete(key: K) {
        delete this.data[key];
    }
    public keys() {
        return Object.keys(this.data);
    }

    public values(): T[] {
        return this.keys().map((key) => this.data[key]);
    }
}
