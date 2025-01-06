export class Oph {
    wasmURL: string;
    allowFunction: (url: URL) => boolean;
    sw: ServiceWorkerRegistration;

    constructor(url: string, allowFunction: (url: URL) => boolean) {
        // better error in case user forgets the `new` keyword
        if (!(this instanceof Oph)) {
            throw new TypeError("Classes must be initialized using the 'new' keyword.");
        }
        if(!allowFunction) {
            allowFunction = (url: URL) => {
                const extensions = ['.js', '.html', '.css', '.ico'];
                return !extensions.find((ext: string) => url.pathname.endsWith(ext))
            }
        }
        this.wasmURL = url;
        this.allowFunction = allowFunction;
    }

    private postMessages(sw: ServiceWorkerRegistration) {
        const active = sw.active
        if(active) {
            const data = {
                wasmURL: this.wasmURL,
                allowFunctionSerialized: this.allowFunction.toString()
            }
            active.postMessage({ type: 'clientattached', value: data })
            console.log('message posted')
            return true;
        }
        throw Error('sw is not active so no message was posted')
    }

    private async registerServiceWorker() {
        const serviceWorkerKey = 'serviceWorker';
        if(navigator[serviceWorkerKey]) {
            const sw = await navigator.serviceWorker.register("./ophSW.js")
            await new Promise((resolve) => {
                sw.addEventListener('updatefound', () => {
                    const installing = sw.installing;
                    if(!sw.installing && this.postMessages(sw)) {
                        resolve(0)
                    } else {
                        installing.addEventListener('statechange', () => {
                            if(installing.state === 'activated' && this.postMessages(sw)) {
                                resolve(0)
                            }
                        })
                    }
                })
            })
            return sw;
        }
        const error = `'${serviceWorkerKey}' is missing from navigator. Is this localhost or https?`
        throw new Error(error)
    }

    private async setupSyncEventListeners(sw: ServiceWorkerRegistration) {
        // @ts-ignore
        window.addEventListener("online", () => {
            sw.active.postMessage({ 
                type: 'sync',
                value: true
            })
        })
        // @ts-ignore
        window.addEventListener("offline", () => {
            sw.active.postMessage({ 
                type: 'sync',
                value: false
            })
        })
    }

    public async serve() {
        this.sw = await this.registerServiceWorker()
        await this.setupSyncEventListeners(this.sw);
    }
}
