declare var require: any;
declare var global: any;
import isNode from "./isNode";

if (!isNode && global) {
    global["ws"] = null;
}

export default (isNode ? require("ws") : WebSocket) as WebSocket;