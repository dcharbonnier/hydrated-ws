export function computedFrom(...rest) {
    return function(target, key, descriptor) {
        descriptor.get.dependencies = rest;
        return descriptor;
    };
}
