export class Dict<K extends string, T> {

    private values: { [key: string]: T } = {};

    public get(key: K): T {
        return this.values[key];
    }

    public set(key: K, value: T) {
        this.values[key] = value;
    }
}
