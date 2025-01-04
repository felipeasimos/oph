# Oph

Small middleware for helping you implement server-on-client solutions with rust.

Idea inspired by [`wasm-service`](https://github.com/richardanaya/wasm-service), which presented me to the server-on-client concept.

## Features

* Use whatever rust web framework you want!¹
* Static hosting friendly! (Github Pages, Neocities, etc)

¹ NOTE: the rust framework of choice should support wasm, like most of them do!

## How to Use

### In Rust:

* annotate a function with `#[oph::get_response]`. The function should receive a `Request` and return a `Response`.

```
#[oph_macros::get_response]
fn handler(req: oph::Request) -> oph::Response {

    oph::Response {
        status: oph::http::status::StatusCode::OK,
        headers: vec![("Content-Type".to_string(), "text/html".to_string())],
        body: b"<p>hello world!<p>".to_vec()
    }
}
```

### In Javascript:

* Pass the server `.wasm` URL to the `Oph` constructor and `serve` it.

```
const oph = new Oph("server.wasm")
oph.serve();
```

That's it! A service worker will then intercept all requests and forward them to the function marked with `get_response` in the Rust world.
