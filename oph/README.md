# Oph

Small middleware for helping you implement server-on-client solutions with rust.

Idea initially based on [`wasm-service`](https://github.com/richardanaya/wasm-service), which presented me the whole server-on-client concept.

## Features

* Use whatever rust web framework you want!¹
* Static hosting friendly! (Github Pages, Neocities, etc)

¹ NOTE: the rust framework of choice should support wasm, but most of them do!

## How to Use

In Rust:
* Implement a `get_oph_response` function, that receives a `Request` and returns a `Response`.

```
use oph;
fn get_oph_response(req: oph::Request) {
    oph::Response(
        oph::method::POST,
        req.uri,
        req.headers,
        "<p>This is the body</p>"
    )
}
```

In Javascript:
* Pass the server WASM module to the `Oph` constructor and serve it.

```
const server_in_wasm = await fetch("server.wasm");
const module = new WebAssembly.Module(server_in_wasm.arrayBuffer())
Oph(module).serve();
```

That's it! A service worker will then intercept all requests and forward them to `get_response`.
