/* tslint:disable:no-var-requires */
try {
    const ws: typeof WebSocket = typeof (WebSocket) !== "undefined" ? WebSocket : require("ws");
} catch (e) {
    // Did not found a WebSocket implementation,
    // if you are compiling with webpack and are using this module on a browser this is expected
    // if you use this module on the server side install node ws
    const ws: null;
}
export default ws;
