[![Build Status](https://img.shields.io/travis/dcharbonnier/advanced-websocket/master.svg?style=flat-square)](https://travis-ci.org/dcharbonnier/advanced-websocket)
[![devDependency Status](https://img.shields.io/david/dev/dcharbonnier/advanced-websocket.svg?style=flat-square)](https://david-dm.org/dcharbonnier/advanced-websocket#info=devDependencies)
[![Build Status](https://saucelabs.com/buildstatus/dcc)](https://saucelabs.com/beta/builds/531985a1f22d43c2b80a0beb38d72b5a)
[![Coveralls github branch](https://img.shields.io/coveralls/github/dcharbonnier/advanced-websocket/master.svg)]()

[![Build Status](https://saucelabs.com/browser-matrix/dcc.svg)](https://saucelabs.com/beta/builds/531985a1f22d43c2b80a0beb38d72b5a)

Support :

- [x] Browser (WebSocket API compatible)
- [x] Nodejs with ws (To be tested)
- [x] Reconnect (with an exponential truncated backoff by default)
- [x] Multiplexing
- [x] Layers
- [ ] Url change (WIP)

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

#### A combination that use the 3 objects to create an authentication channel, a data channel (that can be used by any library expecting a regular websocket) and a robust websocket

```typescript
const ws = new Waterfall("wss://server", null, {
    connectionTimeout: 2000,
    retryPolicy: exponentialTruncatedBackoff(100, Number.MAX_VALUE)
});
const authChannel = new Pipe(ws, AUTH_CHANNEL);
const authFilter = new Dam(ws);
const shareDbChannel = new Pipe(authFilter, SHAREDB_CHANNEL);

authChannel.onopen = () => {
    authChannel.send(JSON.stringify(TOKEN));    
}
authChannel.onmessage = (message) => {
    if(message.data === "login") {
        authFilter.status = "OPEN";
    } else if(message.data === "logout") {
        authFilter.status = "CLOSED";
    }
}

const db = new ShareDb(shareDbChannel);
```
 
