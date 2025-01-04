export class Oph {
    wasmURL: string;
    sw: ServiceWorkerRegistration;

    constructor(url: string) {
        // better error in case user forgets the `new` keyword
        if (!(this instanceof Oph)) {
            throw new TypeError("Classes must be initialized using the 'new' keyword.");
        }
        this.wasmURL = url;
    }

    private postMessages(sw: ServiceWorkerRegistration) {
        if(sw.active) {
            sw.active.postMessage({ type: 'clientattached', value: this.wasmURL })
            console.log('message posted')
        } else {
            console.log('sw is not active so no message was posted')
        }
    }

    private async registerServiceWorker() {
        const serviceWorkerKey = 'serviceWorker';
        if(navigator[serviceWorkerKey]) {
            const sw = await navigator.serviceWorker.register("./ophSW.js")
            sw.addEventListener('updatefound', () => {
                const installing = sw.installing;
                if(!sw.installing && sw.active) {
                    this.postMessages(sw)
                } else {
                    installing.addEventListener('statechange', () => {
                        if(installing.state === 'activated') {
                            this.postMessages(sw)
                        }
                    })
                }
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
