import type { Blockstore, Options } from 'interface-blockstore';
import type { Context } from '../types';
import type { AwaitIterable, Pair, Batch, Query, KeyQuery } from 'interface-store';

import { CID } from 'multiformats';

import { DynamoDBClient, CreateTableCommand, CreateTableCommandInput, ListTablesCommand, PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { create_table } from './dynamodb_helpers';
import { create } from 'domain';

// `level` works in Node.js 12+ and Electron 5+ on Linux, Mac OS, Windows and
// FreeBSD, including any future Node.js and Electron release thanks to Node-API, including ARM
// platforms like Raspberry Pi and Android, as well as in Chrome, Firefox, Edge, Safari, iOS Safari
//  and Chrome for Android.
export class BlockstoreDynamo implements Blockstore {
  db: DynamoDBClient;

  /**
   * @param location - must be a directory path (relative or absolute) where LevelDB will store its
   * files, or in browsers, the name of
   * the {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase IDBDatabase}
   * to be opened.
   */
  constructor(location: string, abstract_db?: any) {
    this.db = abstract_db  || new DynamoDBClient({})
  }

  async open(): Promise<void> {
    // set up tables if they don't exist
    create_table(this.db, 'blocks');
  }

  /**
   * releases all file handles and locks held by the underlying db.
   */
  async close(): Promise<void> {
    
  }

  async put(key: CID, val: Uint8Array, _ctx?: Options): Promise<void> {
    const put_command = new PutItemCommand({  TableName: 'blocks', Item: { cid: {S: key.toString()}, data: {B: val} } });
    const put_result =  await this.db.send(put_command);
    return Promise.resolve();
  }

  async get(key: CID, _ctx?: Options): Promise<Uint8Array> {
    const get_command = new GetItemCommand({ TableName: 'blocks', Key: { cid: {S: key.toString()} } });
    const get_result = await this.db.send(get_command);
    return get_result.Item!.data.B!;
  }

  async has(key: CID, _ctx?: Options): Promise<boolean> {
    return !! await this.get(key);
  }

  delete(key: CID, _ctx?: Options): Promise<void> {
    return this.db.del(key.toString());
  }

  async * putMany(source: AwaitIterable<Pair<CID, Uint8Array>>, _ctx?: Options):
    AsyncIterable<Pair<CID, Uint8Array>> {

    for await (const entry of source) {
      await this.put(entry.key, entry.value, _ctx);

      yield entry;
    }
  }

  async * getMany(source: AwaitIterable<CID>, _ctx?: Options): AsyncIterable<Uint8Array> {
    for await (const key of source) {
      yield this.get(key);
    }
  }

  async * deleteMany(source: AwaitIterable<CID>, _ctx?: Options): AsyncIterable<CID> {
    for await (const key of source) {
      await this.delete(key, _ctx);

      yield key;
    }
  }

  /**
   * deletes all entries
   */
  clear(): Promise<void> {
    return this.db.clear();
  }

  batch(): Batch<CID, Uint8Array> {
    throw new Error('not implemented');
  }

  query(_query: Query<CID, Uint8Array>, _ctx?: Options): AsyncIterable<Pair<CID, Uint8Array>> {
    throw new Error('not implemented');
  }

  queryKeys(_query: KeyQuery<CID>, _ctx?: Options): AsyncIterable<CID> {
    throw new Error('not implemented');
  }
}

/**
 * sleeps for the desired duration
 * @param durationMillis the desired amount of sleep time
 * @returns when the provided duration has passed
 */
function sleep(durationMillis): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, durationMillis));
}