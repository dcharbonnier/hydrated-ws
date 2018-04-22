// tslint:disable:interface-name
interface Array<T> {
    find(predicate: (search: T, index: number) => boolean|void): T;
}
