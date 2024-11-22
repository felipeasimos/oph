async function registerServiceWorker() {
    const serviceWorkerKey = 'serviceWorker';
    if(navigator[serviceWorkerKey]) {
        const sw = await navigator.serviceWorker.register("sw.js")
        sw.addEventListener('statechange', event => {
            console.log('statechange', event)
        })
        sw.addEventListener('controllerchange', event => {
            console.log('controllerchange', event)
        })
        return sw;
    }
    const error = `'${serviceWorkerKey}' is missing from navigator. Is this localhost or https?`
    console.log(error)
    throw new Error(error)
}

async function main() {
    const sw = await registerServiceWorker();
    console.log('service worker registered')
}

window.onload = main();
