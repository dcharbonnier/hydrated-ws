const ws: typeof WebSocket = typeof (WebSocket) !== "undefined" ? WebSocket : require("ws");

export default ws;

