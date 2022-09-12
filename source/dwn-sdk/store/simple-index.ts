
import _ from 'lodash';

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

    makeKeyVal(key: string, object: any): string {
        return `${key}|${_.get(object, key.split('.'))}`;
    }
    put(object: any): void {
        const keyVals = this.keys.map(key => this.makeKeyVal(key, object));
        this.documents.set(keyVals.join('-'), object.id);
    }

    query(query: string[]): string[] {
        const keyVals = query.sort().join('-')
        const id = this.documents.get(keyVals);
        return id ? [id] : [];
    }

    delete(id: string): any {

    }

    clear(): void {

    }
}