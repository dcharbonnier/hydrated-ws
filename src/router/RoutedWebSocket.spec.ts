/* tslint:disable:no-unused-expression */

import WebSocket from "../polyfill/WebSocket";

import { expect } from "chai";
import { IRouterConnector } from "./IRouterConnector";
import { RoutedWebSocket } from "./RoutedWebSocket";
import { Router } from "./Router";

describe("RoutedWebSocket", () => {
        it("should be connecting",  () => {
            const ws = new RoutedWebSocket(null, null);
            expect (ws.readyState).to.equal(WebSocket.CONNECTING);
        });
        it("should send a message",  (done) => {
            const ws = new RoutedWebSocket((data: any) => {
                expect(data).to.equal("test");
                done();
            }, null);
            ws.send("test");
        });
        it("should close",  (done) => {
            const ws = new RoutedWebSocket(null, (code: any, reason: any) => {
                expect(code).to.equal(1000);
                expect(reason).to.equal(void 0);
                done();
            });
            ws.close();
        });
        it("should close ans send code + reason",  (done) => {
            const ws = new RoutedWebSocket(null, (code: any, reason: any) => {
                expect(code).to.equal(2000);
                expect(reason).to.equal("test");
                done();
            });
            ws.close(2000, "test");
        });

        it("should return empty properties",  () => {
            const ws = new RoutedWebSocket(null, null);
            expect(ws.url).to.equal("");
            expect(ws.bufferedAmount).to.equal(0);
            expect(ws.extensions).to.equal("");
            expect(ws.protocol).to.equal("");
        });

});
