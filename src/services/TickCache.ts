class TickCache {
    public objects: object;

    put(key: string, value: any) {
        this.objects[key] = value;
    }

    get(key: string, defaultValue?: any) {
        return this.objects.hasOwnProperty(key) ? this.objects[key] : defaultValue;
    }

    clear(key: string) {
        delete this.objects[key];
    }

    clearAll() {
        this.objects = {};
    }
}

const tickCache = new TickCache();

export default tickCache;
