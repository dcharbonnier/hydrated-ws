# WIP, release in december

[![Build Status](https://img.shields.io/travis/dcharbonnier/advanced-websocket/master.svg?style=flat-square)](https://travis-ci.org/dcharbonnier/advanced-websocket)
[![Greenkeeper badge](https://badges.greenkeeper.io/dcharbonnier/advanced-websocket.svg)](https://greenkeeper.io/)
[![devDependency Status](https://img.shields.io/david/dev/dcharbonnier/advanced-websocket.svg?style=flat-square)](https://david-dm.org/dcharbonnier/advanced-websocket#info=devDependencies)
[![Build Status](https://saucelabs.com/buildstatus/dcc)](https://saucelabs.com/beta/builds/531985a1f22d43c2b80a0beb38d72b5a)
[![Codecov](https://img.shields.io/codecov/c/github/dcharbonnier/advanced-websocket/develop.svg)]()
[![Npm version](https://img.shields.io/npm/v/advanced-websocket.svg)](https://www.npmjs.com/package/advanced-websocket)
[![Build Status](https://saucelabs.com/browser-matrix/dcc.svg)](https://saucelabs.com/beta/builds/531985a1f22d43c2b80a0beb38d72b5a)

Support :

- [x] Browser (WebSocket API compatible)
- [x] Nodejs with ws (WebSocket API compatible)

- [x] Waterfall - Reconnect (exponential truncated backoff by default, fully configurable)
- [x] Pipe - Fake multiplexing, based on a string prefix - fake but working
- [x] Dam - Simulate open / close based on your logic, open a pipe after the authentication on an other one for example 
- [x] Tank - No need to monitor the state of the communication the sent messages with be flushed when it open
- [x] Cable - Json rpc2 transport
- [ ] Fizz - Wrap your WebSocket interface for more fun with `once`, `on`, `Promises`
- [ ] Bottling - A json stream with filtering 
- [ ] Url change (WIP)
- [ ] 100% test coverage
- [ ] Your idea here, send an issue, provide a PR 

### With strictly no dependencies

```json
{
  "name": "advanced-websocket",
  ...
  "dependencies": null,
  ...
}
```

### Examples:
#### A simple compatible WebSocket with automatic reconnect :

```typescript
const ws = new Waterfall("wss://server", null, {
    connectionTimeout: 2000,
    retryPolicy: exponentialTruncatedBackoff(100, Number.MAX_VALUE)
});
```

#### Two channels (string messages only) api compatible with WebSocket on the same transport :

```typescript
const ws = new WebSocket("wss://server");
const  channelA = new Pipe(ws, "A");
const  channelB = new Pipe(ws, "B");
```

#### Creating a WebSocket that send "open" "close", "messages" according to the transport layer and some logic :

```typescript
const ws = new WebSocket("wss://server");
const  authentificationLayer = new Dam(ws);
onLogin(() => authenticationLayer.status = "OPEN");
onLogout(() => authenticationLayer.status = "CLOSED");
```

#### A combination that use 5 components to create an authentication channel with rpc, a data channel (that can be used by any library expecting a regular websocket) and a robust websocket

```typescript
const ws = new Waterfall("wss://server", null, {
    connectionTimeout: 2000,
    retryPolicy: exponentialTruncatedBackoff(100, Number.MAX_VALUE)
});
const authChannel = new Cable(new Tank(new Pipe(ws, AUTH_CHANNEL)));
const authFilter = new Dam(ws);
const shareDbChannel = new Tank(new Pipe(authFilter, SHAREDB_CHANNEL));
const db = new ShareDb(shareDbChannel);

try {
    const result = await authChannel.request("login", TOKEN);
    if(result.success) {
        authFilter.status = "OPEN";
    }
} catch {
    // the auth failed
}

```
 
