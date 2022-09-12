import type { Context } from '../types';
import type { GenericMessageSchema, BaseMessageSchema } from '../core/types';
import type { MessageStore } from './message-store';

import { BlockstoreLevel } from './blockstore-level';
import { CID } from 'multiformats/cid';
import { importer } from 'ipfs-unixfs-importer';
import { parseCid } from '../utils/cid';
import { sha256 } from 'multiformats/hashes/sha2';
import { toBytes } from '../utils/data';

import * as cbor from '@ipld/dag-cbor';
import * as block from 'multiformats/block';

import SimpleIndex from './simple-index';

import _ from 'lodash';
import { exporter } from 'ipfs-unixfs-exporter';
import { base64url } from 'multiformats/bases/base64';

import { AbstractLevel } from 'abstract-level';

/**
 * A simple implementation of {@link MessageStore} that works in both the browser and server-side.
 * Leverages LevelDB under the hood.
 */
export class MessageStoreLevel implements MessageStore {
  config: MessageStoreLevelConfig;
  db: BlockstoreLevel;
  // levelDB doesn't natively provide the querying capabilities needed for DWN. To accommodate, we're leveraging
  // a level-backed inverted index
  // TODO: search-index lib does not import type `SearchIndex`. find a workaround, Issue #48, https://github.com/TBD54566975/dwn-sdk-js/issues/48
  index : SimpleIndex;

  /**
   * @param {MessageStoreLevelConfig} config
   * @param {string} config.blockstoreLocation - must be a directory path (relative or absolute) where
   *  LevelDB will store its files, or in browsers, the name of the
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase IDBDatabase} to be opened.
   * @param {string} config.indexLocation - same as config.blockstoreLocation
   */
  constructor(config: MessageStoreLevelConfig = {}) {
    this.config = {
      blockstoreLocation : 'BLOCKSTORE',
      indexLocation      : 'INDEX',
      ...config
    };

    this.db = new BlockstoreLevel(this.config.blockstoreLocation!, this.config.db_constructor);
  }

  async open(): Promise<void> {
    if (!this.db) {
      this.db = new BlockstoreLevel(this.config.blockstoreLocation!, this.config.db_constructor);
    }

    await this.db.open();

    // TODO: look into using the same level we're using for blockstore, Issue #49 https://github.com/TBD54566975/dwn-sdk-js/issues/49
    // TODO: parameterize `name`, Issue #50 https://github.com/TBD54566975/dwn-sdk-js/issues/50
    // calling `searchIndex()` twice without closing its DB causes the process to hang (ie. calling this method consecutively),
    // so check to see if the index has already been "opened" before opening it again.
    if (!this.index) {
      this.index = new SimpleIndex(
        ['tenant', 'method', 'author']
      )
    }
  }

  async close(): Promise<void> {
    await this.db.close();
  }

  async get(cid: CID, ctx: Context): Promise<BaseMessageSchema> {
    const bytes = await this.db.get(cid, ctx);

    if (!bytes) {
      return Promise.reject();
    }

    const decodedBlock = await block.decode({ bytes, codec: cbor, hasher: sha256 });

    const messageJson = decodedBlock.value as GenericMessageSchema;

    if (!messageJson.data) {
      return messageJson;
    }

    // `data`, if present, is chunked into dag-pb unixfs blocks. re-inflate the chunks.
    const { descriptor } = messageJson;
    const dataCid = parseCid(descriptor.dataCid);

    const dataDagRoot = await exporter(dataCid, this.db);
    const dataBytes = new Uint8Array(dataDagRoot.size);
    let offset = 0;

    for await (const chunk of dataDagRoot.content()) {
      dataBytes.set(chunk, offset);
      offset += chunk.length;
    }

    messageJson.data = base64url.baseEncode(dataBytes);

    return messageJson as BaseMessageSchema;
  }

  async query(query: any, ctx: Context): Promise<BaseMessageSchema[]> {
    // MUST scope the query to the tenant
    query.tenant = ctx.tenant;

    const messages: BaseMessageSchema[] = [];

    // parse query into a query that is compatible with the index we're using
    const indexQueryTerms: string[] = MessageStoreLevel.buildIndexQueryTerms(query);

    const indexResults = this.index.query(indexQueryTerms);

    for (const result of indexResults) {
      const cid = CID.parse(result);
      const message = await this.get(cid, ctx);

      messages.push(message);
    }

    return messages;
  }


  async delete(cid: CID, ctx: Context): Promise<void> {
    await this.db.delete(cid, ctx);
    await this.index.delete(cid.toString());

    return;
  }

  async put(messageJson: BaseMessageSchema, ctx: Context): Promise<void> {

    let data = undefined;
    if (messageJson['data'] !== undefined) {
      const messageJsonWithData = messageJson as GenericMessageSchema;
      data = messageJsonWithData.data;

      // delete data. If data is present we'll be chunking it and storing it as unix-fs dag-pb
      // encoded.
      delete messageJsonWithData.data;
    }

    const encodedBlock = await block.encode({ value: messageJson, codec: cbor, hasher: sha256 });

    await this.db.put(encodedBlock.cid, encodedBlock.bytes);

    if (data) {
      const chunk = importer([{ content: toBytes(data) }], this.db, { cidVersion: 1 });

      // for some reason no-unused-vars doesn't work in for loops. it's not entirely surprising because
      // it does seem a bit strange to iterate over something you never end up using but in this case
      // we really don't have to access the result of `chunk` because it's just outputting every unix-fs
      // entry that's getting written to the blockstore. the last entry contains the root cid
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of chunk);
    }

    const indexDocument = {
      ...messageJson.descriptor,
      id    : encodedBlock.cid.toString(),
      author : ctx.author,
      tenant : ctx.tenant
    };


    await this.index.put(indexDocument);
  }

  /**
   * deletes everything in the underlying datastore and indices.
   */
  async clear(): Promise<void> {
    await this.db.clear();
    await this.index.clear();
  }

  /**
   * recursively parses a query object into a list of flattened terms that can be used to query the search
   * index
   * @example
   * buildIndexQueryTerms({
   *    ability : {
   *      method : 'CollectionsQuery',
   *      schema : 'https://schema.org/MusicPlaylist'
   *    }
   * })
   * // returns ['ability.method:CollectionsQuery', 'ability.schema:https://schema.org/MusicPlaylist' ]
   * @param query - the query to parse
   * @param terms - internally used to collect terms
   * @param prefix - internally used to pass parent properties into recursive calls
   * @returns the list of terms
   */
  private static buildIndexQueryTerms(query: any, terms: string[] = [], prefix: string = ''): string[] {
    for (const property in query) {
      const val = query[property];

      if (_.isPlainObject(val)) {
        MessageStoreLevel.buildIndexQueryTerms(val, terms, `${prefix}${property}.`);
      } else {
        terms.push(`${prefix}${property}|${val}`);
      }
    }

    return terms;
  }
}

type MessageStoreLevelConfig = {
  db_constructor?: AbstractLevel<any>,
  blockstoreLocation?: string,
  indexLocation?: string,
};