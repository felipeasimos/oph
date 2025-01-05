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

* Pass an URL that returns the `.wasm` to the `Oph` constructor and `serve` it.

```
const oph = new Oph("server.wasm")
oph.serve();
```

That's it! A service worker will then intercept all requests and forward them to the function marked with `get_response` in the Rust world.

## Running Examples

From the project root:

```
cargo build -p <example-folder-name>
```

In an `examples/` folder:

1. Install the `oph-js` dependency

```
npm i
```

2. Link `.wasm` and `ophSW.js` to example folder root and run http server
    * The linking is needed so that `/ophSW.js` returns the service worker during registration. Our service worker wouldn't be able to intercept all requests in the domain if its file wasn't served from the top level.
    * We also can't just do `../../target/` during fetch to get the `.wasm` file, hence its linking
```
npm run serve
```

3. Access `localhost:8080` and see the response in the console by typing²:

```
(await fetch('http://localhost:8080/hi')).text()
```

NOTE²: you may need to unregister the service worker to see different responses when switching between examples
