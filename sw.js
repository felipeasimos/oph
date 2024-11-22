let wasmModule = null;
const appUri = './target/wasm32-unknown-unknown/debug/raw_example.wasm';

async function loadWasmApp() {
    console.log('loading wasm app...')
    const response = await fetch(appUri, { cache: "no-cache" });
    wasmModule = await WebAssembly.instantiateStreaming(response, {});
    console.log('loaded wasm app!')
}

async function ensureNewWasmAppVersionIsLoaded() {
    if(wasmModule) {
        return;
    }
    return loadWasmApp();
}

self.addEventListener('install', async (event) => {
    console.log('service worker lifecyle event: install');

    event.waitUntil(ensureNewWasmAppVersionIsLoaded())
    self.skipWaiting();
})

self.addEventListener('activate', (event) => {
    self.clients.claim();
    console.log('service worker lifecyle event: activate');
    event.waitUntil(ensureNewWasmAppVersionIsLoaded())
})

self.addEventListener('message', (event) => {
    if(event.data.type === 'clientattached') {
        event.waitUntil(ensureNewWasmAppVersionIsLoaded())
    }
})

const utf8enc = new TextEncoder();
const utf8dec = new TextDecoder("utf8");

function readUtf8FromMemory(app, start, len) {
  const memory = new Uint8Array(app.exports.memory.buffer);
  const text = utf8dec.decode(
    memory.subarray(start, start + len)
  );
  return text;
}

function writeUtf8ToMemory(app, bytes, start) {
  const memory = new Uint8Array(app.exports.memory.buffer);
  memory.set(bytes, start);
}

async function getWasmResponse(event) {
    try {
        const app = wasmModule.instance;
        const requestBody = new Uint8Array(await event.request.arrayBuffer()) || [];
        const request = JSON.stringify({
            method: event.request.method,
            url: event.request.url,
            headers: Array.from(event.request.headers),
            body: Array.from(requestBody)
        });
        const bytes = utf8enc.encode(request);
        const len = bytes.length;
        const requestPtr = app.exports.__oph_function_allocate_request(len);
        writeUtf8ToMemory(app, bytes, requestPtr);
        const responseHandle = app.exports.__oph_function_get_response();
        const responsePtr = app.exports.__oph_function_get_response_ptr();
        const responseLen = app.exports.__oph_function_get_response_len();
        const responseContent = readUtf8FromMemory(app, responsePtr, responseLen);
        const response = JSON.parse(responseContent)
        const responseBody = utf8dec.decode(new Uint8Array(response.body));

        return new Response(responseBody, {
            status: response.status,
            headers: response.headers
        });
    } catch(error) {
        console.error("error querying wasm app for result", { error, event })
    }
}

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url)
    console.log('fetch event: ', url.toString());

    console.log(url)
    const useWasmServer = url.origin == event.target.location.origin
        && !url.pathname.endsWith(appUri)
        && !url.pathname.endsWith("/sw.js")
        && wasmModule;
    if (!useWasmServer) {
        console.log("not using wasm server for this request")
        return;
    }
    console.log("using wasm server for this request")

    event.respondWith(getWasmResponse(event));
})

self.addEventListener('push', (event) => {
    console.log('push event')
})
