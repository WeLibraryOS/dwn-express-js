
export default class SimpleIndex {

    keys: string[]
    documents: Map<string, string>;

    constructor(keys: string[]) {
        this.keys = keys.sort();
        this.documents = new Map();
    }
    
    open(): void {

    }
    close(): void {

    }
    getDotKeyVal(key: string, object: any): string {
        const keys = key.split('.');
        let val = object;
        for (const key of keys) {
            val = val[key];
            if (val === undefined) {
                return '';
            }
        }
        return val;
    }

    makeKeyVal(key: string, object: any): string {
        return `${key}|${this.getDotKeyVal(key, object)}`;
    }
    put(object: any): void {
        const keyVals = this.keys.map(key => this.makeKeyVal(key, object));
        this.documents.set(keyVals.join('.'), object.id);
    }

    query(query: string[]): string[] {
        const keyVals = query.sort().join('.')
        const id = this.documents.get(keyVals);
        return id ? [id] : [];
    }

    delete(id: string): any {

    }

    clear(): void {

    }
}