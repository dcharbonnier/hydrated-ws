declare var global: any;

let isNode: boolean;
try {
    isNode = Object.prototype.toString.call(global.process) === "[object process]";
} catch {
    isNode = false;
}

export default isNode;
