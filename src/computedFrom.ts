export function computedFrom(...rest) {
    return (target, key, descriptor) => {
        descriptor.get.dependencies = rest;
        return descriptor;
    };
}
