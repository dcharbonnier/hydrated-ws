<p align="center">
  <img src="./logo.png">
</p>

[![Gitter](https://img.shields.io/gitter/room/hydraded-ws/Lobby.svg?style=flat-square)](https://gitter.im/hydraded-ws/Lobby)

[![Build Status](https://img.shields.io/travis/dcharbonnier/hydraded-ws/master.svg?style=flat-square)](https://travis-ci.org/dcharbonnier/hydraded-ws)
[![Greenkeeper badge](https://badges.greenkeeper.io/dcharbonnier/hydraded-ws.svg)](https://greenkeeper.io/)
[![devDependency Status](https://img.shields.io/david/dev/dcharbonnier/hydraded-ws.svg?style=flat-square)](https://david-dm.org/dcharbonnier/hydraded-ws#info=devDependencies)
[![Codecov](https://img.shields.io/codecov/c/github/dcharbonnier/hydraded-ws/develop.svg?style=flat-square)](https://codecov.io/gh/dcharbonnier/hydraded-ws)
[![Npm version](https://img.shields.io/npm/v/hydraded-ws.svg?style=flat-square)](https://www.npmjs.com/package/hydraded-ws)
[![Code Climate](https://img.shields.io/codeclimate/maintainability/dcharbonnier/hydraded-ws.svg?style=flat-square)](https://codeclimate.com/github/dcharbonnier/hydraded-ws/)


Advanced WebSocket is a collection of lightweight (no dependencies) and
simple components to build complex communication
path over Websocket on the server and the browser.

All components are seen from the outside world like a WebSocket allowing
you to integrate is on any existing project.

<!-- toc -->

- [Examples](#examples)
    + [Waterfall](#waterfall)
    + [Pipe](#pipe)
    + [Dam](#dam)
    + [Tank](#tank)
    + [Cable](#cable)
    + [Advanced](#advanced)
- [Roadmap](#roadmap)
- [FAQ](#faq)

<!-- tocstop -->

Examples
========
### Waterfall

The waterfall is a simple compatible WebSocket with automatic reconnect
support

The retry policy ermit a full customisation of the reconnection and a
default
exponential truncated backoff policy is provides by default.

```typescript
const ws = new Waterfall("wss://server", null, {
    connectionTimeout: 2000,
    retryPolicy: exponentialTruncatedBackoff(100, Number.MAX_VALUE)
});
```

### Pipe

The Pipe allow you to multiplex string channels, add a pipe on a
Websocket on both side and
receive only the messages transmitted into this pipe.

```typescript
const ws = new WebSocket("wss://server");
const  channelA = new Pipe(ws, "A");
const  channelB = new Pipe(ws, "B");
```

### Dam

Has you can split your WebSockets in different Pipes it become useful
to be able to control an open or closed status, faking a connection.
You can for example create a pipe to communicate and an other to
authenticate and change the communication status according to the
authentication status.


```typescript
const ws = new WebSocket("wss://server");
const  authenticatedWebSocketr = new Dam(ws);
onLogin(() => authenticatedWebSocketr.status = "OPEN");
onLogout(() => authenticatedWebSocketr.status = "CLOSED");
```


### Tank

Checking if a socket is open to be able to send your message, delaying
those messages for when the WebSocket is open is a repetitive task.
Wrap your socket in a Tank and you can use `send` at anytime, if
the socket is closed, the messages will be buffered and has soon has the
websocket open they will be flushed in order.

```typescript
const ws = new Tank(new WebSocket("wss://server"));
ws.send("I've send this message before the opening of the websocket");
```

### Cable

Doing an RPC over a websocket should be trivial, the Cable provide a
convenient way to register methods and to call them on both side of the
connection.

```typescript
// Client 1
const cable = new Cable(ws);
cable.register("ping", async () => {
   return "pong";
 });
 cable.notify("hello", {name:"client 1"});

 // Client 2
 const cable = new Cable(ws);
 cable.register("hello", async ({name:string}) => {
   console.log(`${name} said hello`);
  });
 try {
   const res = await cable.request("ping");
   assert.equal(res,"pong");
 } catch(e) {
   if(e.code === Cable.SERVER_ERROR) {
     console.log("Implementation error on the server");
   }
   throw e;
 }
 ```
### Advanced

A combination that use 5 components to create an authentication channel
with rpc, a data channel (that can be used by any library expecting a
regular websocket) and a robust websocket

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


Roadmap
=======

- [x] Browser (WebSocket API compatible)
- [x] Nodejs with ws (WebSocket API compatible)
- [x] Waterfall - Reconnect (exponential truncated backoff by default,
fully configurable)
- [x] Pipe - Multiplexing, based on a string prefix
- [x] Dam - Simulate open / close based on your logic, open a pipe after
he authentication on an other one for example
- [x] Tank - No need to monitor the state of the communication the sent
messages with be flushed when it open
- [x] Cable - Json rpc2 transport
- [ ] Split the project in different modules with yarn workspace and
lerna
- [ ] Fizz - Wrap your WebSocket interface for more fun with `once`,
`on`, `Promises`
- [ ] Bottling - A json stream with filtering
- [ ] Url change (WIP)
- [ ] 100% test coverage
- [ ] Your idea here, send an issue, provide a PR


FAQ
=======

#### Webpack
Webpack complain about the `ws` implementation of WebSocket, the errors
are :
`Can't resolve 'net'` and `Can't resolve 'tls'`.

The solution consist in ignoring the ws module that can't be used in a
browser (and not required), the polyfill will detect the browser
implementation of the WebSocket and use it.
To ignore the module, add a rule to your webpack config file :

`{test: /[\/\\]node_modules[\/\\]ws[\/\\].+\.js$/, use: 'null-loader'},`
 
#### Can't resolve 'ws' 
If you're using this module on the client side webpack will warn you
with this message when you pack the module, if you're using this module
on the server side you need to install `ws`
