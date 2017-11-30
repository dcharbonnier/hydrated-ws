declare var global: any;

let isNode = false;
try {
    Object.prototype.toString.call(global.process) === '[object process]';
    isNode = true;
} catch (e) {
}

export default isNode;

