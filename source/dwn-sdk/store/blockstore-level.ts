import type { Blockstore, Options } from 'interface-blockstore';
import type { Context } from '../types';
import type { AwaitIterable, Pair, Batch, Query, KeyQuery } from 'interface-store';

import { Level } from 'level';
import { CID } from 'multiformats';

import { AbstractLevel } from 'abstract-level';


// `level` works in Node.js 12+ and Electron 5+ on Linux, Mac OS, Windows and
// FreeBSD, including any future Node.js and Electron release thanks to Node-API, including ARM
// platforms like Raspberry Pi and Android, as well as in Chrome, Firefox, Edge, Safari, iOS Safari
//  and Chrome for Android.
export class BlockstoreLevel implements Blockstore {
  db: AbstractLevel<any, string, Uint8Array>;

  /**
   * @param location - must be a directory path (relative or absolute) where LevelDB will store its
   * files, or in browsers, the name of
   * the {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase IDBDatabase}
   * to be opened.
   */
  constructor(location: string, abstract_db?: AbstractLevel<any, string, Uint8Array>) {
    this.db = abstract_db  || new Level(location, { keyEncoding: 'utf8', valueEncoding: 'binary' });
  }

  async open(): Promise<void> {
    while (this.db.status === 'opening' || this.db.status === 'closing') {
      await sleep(200);
    }

    if (this.db.status === 'open') {
      return;
    }

    // db.open() is automatically called by the database constructor. We're calling it explicitly
    // in order to explicitly catch an error that would otherwise not surface
    // until another method like db.get() is called. Once open() has then been called,
    // any read & write operations will again be queued internally
    // until opening has finished.
    return this.db.open();
  }

  /**
   * releases all file handles and locks held by the underlying db.
   */
  async close(): Promise<void> {
    while (this.db.status === 'opening' || this.db.status === 'closing') {
      await sleep(200);
    }

    if (this.db.status === 'closed') {
      return;
    }

    return this.db.close();
  }

  put(key: CID, val: Uint8Array, _ctx?: Options): Promise<void> {
    return this.db.put(key.toString(), val);
  }

  async get(key: CID, _ctx?: Options): Promise<Uint8Array> {
    try {
      const val = await this.db.get(key.toString());
      // TODO: set up database internal storage correctly so we don't have to do this
      return new Uint8Array(val.split(',').map((c) => parseInt(c, 10)));
    } catch (e) {
      // level throws an error if the key is not present. Return empty array instead.
      if (e.code === 'LEVEL_NOT_FOUND') {
        return Promise.resolve(new Uint8Array());
      } else {
        throw e;
      }
    }
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