
import _ from 'lodash';

export default class SimpleIndex {

    partial_messages: object[];
    keys: string[];

    // we will map flattened object keys onto object ids onto values
    documents: Map<string, Map<string, string>>;

    constructor(partial_messages: object[]) {
        this.partial_messages = partial_messages;

        // schemas MUST contain descriptor.method OR data and descriptor.schema

        this.keys = new Array()
        partial_messages.forEach(partial_message => {
            const flattened = this.flatten(partial_message);
            const keys = flattened.keys();
            this.keys = this.keys.concat([...keys]);
        })

        this.documents = new Map();
    }
    
    open(): void {

    }
    close(): void {

    }


    flatten(obj, prefix: string = ''): Map<string, string> {

        var propName = (prefix.length) ? prefix + '.' :  '',
        ret = new Map<string, string>();

        for(var attr in obj){
            const key = propName + attr;
            if (typeof obj[attr] === 'object'){
                ret = new Map([...ret, ...this.flatten(obj[attr], key)]);
            }
            else{
                ret.set(key, obj[attr]);
            }
        }
        return ret;
    }

    put(id: string, message: any): void {
        const flattened = this.flatten(message);
        for (const key of this.keys) {
            if (flattened.get(key)) {
                const existingIds = this.documents.get(key) || new Map();
                const existingValues = existingIds.get(id) || [];
                existingIds.set(id, existingValues.concat(flattened.get(key)));
                this.documents.set(key, existingIds);
            }
        }
    }

    query(query: string[]): string[] {
        const flattened = this.flatten(query);
        const ret: string[] = []
        for (const [query_key, query_value] of flattened) {
            if (this.documents.get(query_key)) {
                const existingIds = this.documents.get(query_key);
                if (existingIds) {
                    for (const [id, values] of existingIds) {
                        if (values.includes(query_value)) {
                            ret.push(id);
                        }
                    }
                }
            }
        }

        // TODO: depupe ret
        return ret;
    }

    delete(id: string): any {
        // TODO: implement
    }

    clear(): void {

    }
}