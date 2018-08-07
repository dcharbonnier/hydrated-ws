export class CableError extends Error {
    constructor(message: string, public readonly code: number) {
        super(message);
        if ((Object as any).setPrototypeOf) {
            (Object as any).setPrototypeOf(this, CableError.prototype);
        } else {
            (this as any).__proto__ = CableError.prototype;
        }

    }
}
