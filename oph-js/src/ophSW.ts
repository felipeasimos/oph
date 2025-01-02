let wasmModule: WebAssembly.WebAssemblyInstantiatedSource | null = null;
let wasmURL: URL | null = null;
let isOnline: boolean = true;

async function loadWasmApp() {
    if(!isOnline || !wasmURL) {
        return;
    }
    const response = await fetch(wasmURL, { cache: "no-cache" });
    wasmModule = await WebAssembly.instantiateStreaming(response, {});
}

async function updateIsOnline(value: boolean) {
    isOnline = value;
    if(isOnline) {
        await loadWasmApp();
    }
}

// Periodically check for new wasm app version
setInterval(() => loadWasmApp(), 1 + (Math.random() * 14 * 60 * 1000));

self.addEventListener('install', async (event: ExtendableEvent) => {
    console.log('service worker lifecyle event: install');

    event.waitUntil(loadWasmApp())
    self.skipWaiting();
})

self.addEventListener('activate', (event: ExtendableEvent) => {
    self.clients.claim();
    console.log('service worker lifecyle event: activate');
    event.waitUntil(loadWasmApp())
})

self.addEventListener('message', (event: ExtendableMessageEvent) => {
    if(event.data.type === 'clientattached') {
        event.waitUntil(loadWasmApp())
        return;
    }
    if(event.data.type === 'sync') {
        event.waitUntil(updateIsOnline(event.data.value));
    }
    if(event.data.type === 'wasmURL') {
        wasmURL = new URL(event.data.value);
    }
})

interface WasmExports {
    __oph_function_allocate_request(len: number): number;
    __oph_function_get_response(): number;
    __oph_function_get_response_ptr(): number;
    __oph_function_get_response_len(): number;
    memory: WebAssembly.Memory;
}

const utf8enc = new TextEncoder();
const utf8dec = new TextDecoder("utf8");

function readUtf8FromMemory(exports: WasmExports, start: number, len: number) {
  const memory = new Uint8Array(exports.memory.buffer);
  const text = utf8dec.decode(
    memory.subarray(start, start + len)
  );
  return text;
}

function writeUtf8ToMemory(exports: WasmExports, bytes: Uint8Array<ArrayBuffer>, start: number) {
  const memory = new Uint8Array(exports.memory.buffer);
  memory.set(bytes, start);
}

async function getWasmResponse(event: FetchEvent) {
    try {
        const wasmExports : WasmExports = <WasmExports> <any> wasmModule.instance.exports;
        const requestBody = new Uint8Array(await event.request.arrayBuffer()) || [];
        const request = JSON.stringify({
            method: event.request.method,
            url: event.request.url,
            headers: Array.from(event.request.headers),
            body: Array.from(requestBody)
        });
        const bytes = utf8enc.encode(request);
        const len = bytes.length;
        const requestPtr = wasmExports.__oph_function_allocate_request(len);
        writeUtf8ToMemory(wasmExports, bytes, requestPtr);
        wasmExports.__oph_function_get_response();
        const responsePtr = wasmExports.__oph_function_get_response_ptr();
        const responseLen = wasmExports.__oph_function_get_response_len();
        const responseContent = readUtf8FromMemory(wasmExports, responsePtr, responseLen);
        const response = JSON.parse(responseContent)
        const responseBody = utf8dec.decode(new Uint8Array(response.body));

        console.log(`${event.request.url} - ${response.status}`)
        return new Response(responseBody, {
            status: response.status,
            headers: response.headers
        });
    } catch(error) {
        console.error("error querying wasm app for result", { error, event })
    }
}

self.addEventListener('fetch', (event: FetchEvent) => {
    event.waitUntil(loadWasmApp())
    const url = new URL(event.request.url)
    console.log('fetch event: ', url.toString());

    const useWasmServer = 
        !(url.pathname == "/")
        && !url.pathname.endsWith(wasmURL.pathname)
        && !url.pathname.endsWith(".js")
        && !url.pathname.endsWith(".html")
        && wasmModule;
    if (!useWasmServer) {
        console.log("not using wasm server for this request")
        console.log(wasmModule)
        return;
    }
    console.log("using wasm server for this request")

    event.respondWith(getWasmResponse(event));
})
