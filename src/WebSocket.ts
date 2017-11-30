export default typeof (WebSocket) !== "undefined" ? WebSocket : require("ws");

