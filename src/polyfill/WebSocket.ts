/* tslint:disable:no-var-requires */

const ws = ((): typeof WebSocket => {
    try {
        return typeof (WebSocket) !== "undefined" ? WebSocket : require("ws");
    } catch (e) {
        // Did not found a WebSocket implementation,
        // if you are compiling with webpack and are using this module on a browser this is expected
        // if you use this module on the server side install node ws
    }
})();
export default ws;
