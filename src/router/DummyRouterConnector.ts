import {Dict} from "../polyfill/Dict";
import MessageEvent from "../polyfill/MessageEvent";
import {IRouterConnector} from "./IRouterConnector";
import {RoutedWebSocket} from "./RoutedWebSocket";

export class DummyRouterConnector implements IRouterConnector {

    public static clear = () => DummyRouterConnector.instances.length = 0;
    private static instances: DummyRouterConnector[] = [];
    public onMessage?: (key: string, data: any) => boolean;
    public onStatus?: (key: string, status: number) => boolean;
    public onBroadcast?: (data: any) => void;
    public onClose?: (key: string, code: number, reason: string) => boolean;
    public subscriptions: Dict<string, RoutedWebSocket[]> = new Dict();

    constructor() {
        DummyRouterConnector.instances.push(this);
    }

    public send(key: string, data: any): void {
        for (const connector of DummyRouterConnector.instances) {
            if (connector !== this && connector.onMessage && connector.onMessage(key, data)) {
                return;
            }
        }
    }

    public emitMessage(key: string, event: MessageEvent): void {
        DummyRouterConnector.instances.forEach((connector) => {
            if (connector !== this) {
                (connector.subscriptions.get(key) || [])
                    .forEach((ws: RoutedWebSocket) => ws.emitMessage(event));
            }
        });
    }

    public subscribe(key: string, ws: RoutedWebSocket) {
        if (!this.subscriptions.has(key)) {
            this.subscriptions.set(key, [ws]);
        } else {
            const subscriptions = this.subscriptions.get(key);
            const index = subscriptions.indexOf(ws);
            if (index === -1) {
                subscriptions.push(ws);
            }
        }
    }

    public unsubscribe(key: string, ws: RoutedWebSocket) {
        const subscriptions = this.subscriptions.get(key) || [];
        const index = subscriptions.indexOf(ws);
        if (index >= 0) {
            subscriptions.splice(index, 1);
        }
    }

    public broadcast(data: any): void {
        DummyRouterConnector.instances.forEach((connector) => {
            if (connector !== this && connector.onBroadcast) {
                connector.onBroadcast(data);
            }
        });
    }

    public readyState(key: string, status: number): void {
        DummyRouterConnector.instances.forEach((connector) => {
            if (connector !== this && connector.onStatus) {
                connector.onStatus(key, status);
            }
        });
    }

    public close(key: string, code: number, reason: string): void {
        for (const connector of DummyRouterConnector.instances) {
            if (connector !== this && connector.onClose && connector.onClose(key, code, reason)) {
                return;
            }
        }
    }
}
