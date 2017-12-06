/* tslint:disable:no-var-requires */
const ws: typeof WebSocket = typeof (WebSocket) !== "undefined" ? WebSocket : require("ws");

export default ws;
