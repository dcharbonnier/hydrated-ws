export class Dict<K extends string, T> {

    private values: { [key: string]: T } = {};

    get(key: K): T {
        return this.values[key];
    }

    set(key: K, value: T) {
        this.values[key] = value;
    }
}