
import _ from 'lodash';

export enum QueryOperation {
    AND,
    OR
}

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

    applyOperation(operation: QueryOperation, number_of_matches: number, number_of_terms: number): Boolean {
        if (operation === QueryOperation.AND) {
            return number_of_matches === number_of_terms;
        } else if (operation === QueryOperation.OR) {
            return number_of_matches > 0;
        } else {
            throw new Error('Invalid operation');
        }
    }


    query(query: object, operation: QueryOperation = QueryOperation.AND): string[] {
        const flattened = this.flatten(query);
        const document_matches: Map<string, number> = new Map();
        for (const [query_key, query_value] of flattened) {
            if (this.documents.get(query_key)) {
                const existingIds = this.documents.get(query_key);
                if (existingIds) {
                    for (const [id, values] of existingIds) {
                        if (values.includes(query_value)) {
                            document_matches.set(id, (document_matches.get(id) || 0) + 1);
                        }
                    }
                }
            }
        }

        // TODO: depupe ret
        return Array.from(document_matches.keys()).filter(id => this.applyOperation(operation, document_matches.get(id)!, flattened.size));
    }

    delete(id: string): any {
        // TODO: implement
    }

    clear(): void {

    }
}