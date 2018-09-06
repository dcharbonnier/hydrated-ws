export default interface IHydratedWebSocketEventMap extends WebSocketEventMap {
    "connecting": CustomEvent<number>;
}
