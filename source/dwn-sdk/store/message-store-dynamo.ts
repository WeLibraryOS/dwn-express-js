import type { Context } from '../types';
import type { GenericMessageSchema, BaseMessageSchema } from '../core/types';
import type { MessageStore } from './message-store';

import { BlockstoreDynamo } from './blockstore-dynamo';
import { CID } from 'multiformats/cid';
import { importer } from 'ipfs-unixfs-importer';
import { parseCid } from '../utils/cid';
import { sha256 } from 'multiformats/hashes/sha2';
import { toBytes } from '../utils/data';

import * as cbor from '@ipld/dag-cbor';
import * as block from 'multiformats/block';

import _ from 'lodash';
import { exporter } from 'ipfs-unixfs-exporter';
import { base64, base64url } from 'multiformats/bases/base64';

import { DynamoDBClient, CreateTableCommand, CreateTableCommandInput, ListTablesCommand, PutItemCommand, GetItemCommand, QueryCommand, QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { create_table } from './dynamodb_helpers';

// TODO: move these into a utils file
const dig = (p, o) =>
  p.reduce((xs, x) => 
    (xs && xs[x]) ? xs[x] : null
  , o)

const flatten = (obj, prefix: string = ''): Map<string, string> => {

    var propName = (prefix.length) ? prefix + '.' :  '',
    ret = new Map<string, string>();

    for(var attr in obj){
        const key = propName + attr;
        if (typeof obj[attr] === 'object'){
            ret = new Map([...ret, ...flatten(obj[attr], key)]);
        }
        else{
            ret.set(key, obj[attr]);
        }
    }
    return ret;
  }

  const dynamoKey = (key: string): string => key.replace(/\./g, '_').replace('descriptor', 'descript0r');

/**
 * A simple implementation of {@link MessageStore} that works in both the browser and server-side.
 * Leverages LevelDB under the hood.
 */
export class MessageStoreDynamo implements MessageStore {
  config: MessageStoreDynamoConfig;
  db: BlockstoreDynamo;
  index: DynamoDBClient;
  index_schema: object;
  /**
   * @param {MessageStoreDynamoConfig} config
   * @param {string} config.blockstoreLocation - must be a directory path (relative or absolute) where
   *  LevelDB will store its files, or in browsers, the name of the
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase IDBDatabase} to be opened.
   * @param {string} config.indexLocation - same as config.blockstoreLocation
   */
  constructor(config: MessageStoreDynamoConfig = {}) {
    this.config = {
      blockstoreLocation : 'BLOCKSTORE',
      indexLocation      : 'INDEX',
      ...config
    };

    
    this.index_schema = {
      descriptor: {
        method: 'string',
        grantedTo: 'string',
        grantedBy: 'string',
        // dataFormat: 'string', // don't need this here as we are using desctiptor.dataFormat as the hash key
        scope: {
          method: 'string'
        },
        recordId: 'string',
        dataCid: 'string',
        nonce: 'string'
      }
    }
  }

  async open(): Promise<void> {
    if (!this.db) {
      this.db = new BlockstoreDynamo(this.config.blockstoreLocation!, this.config.injectDB);
    }

    await this.db.open();

    // TODO: look into using the same level we're using for blockstore, Issue #49 https://github.com/TBD54566975/dwn-sdk-js/issues/49
    // TODO: parameterize `name`, Issue #50 https://github.com/TBD54566975/dwn-sdk-js/issues/50
    // calling `searchIndex()` twice without closing its DB causes the process to hang (ie. calling this method consecutively),
    // so check to see if the index has already been "opened" before opening it again.
    if (!this.index) {
      this.index = new DynamoDBClient({});

      /*
      const items = flatten(this.index_schema);
      const index_attributes =  Array.from(items.keys()).map((key) => 
        ( { 
          AttributeName: key, 
          AttributeType: 'S' 
        })
      )
      */

      create_table(this.index, 'messages', [
        {
          // TODO: don't really need a good key here because we don't have enough data, also descriptor.dataFormat is a magic value we should put it into a constant
          AttributeName: dynamoKey('descriptor.dataFormat'),
          KeyType: 'HASH'
        }],
        null, [
        {
          AttributeName: dynamoKey('descriptor.dataFormat'),
          AttributeType: 'S'
        }
      ]);
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
    const dataCid = parseCid(descriptor.dataCid!);

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

  async query(query: object, ctx: Context): Promise<BaseMessageSchema[]> {

    const messages: BaseMessageSchema[] = [];

    const query_terms = flatten(query);

    const query_keys = Array.from(query_terms.keys()).filter(item => item != 'descriptor.dataFormat')

    const query_command_input: QueryCommandInput = {
      TableName: 'messages',
      KeyConditionExpression: 'descript0r_dataFormat = :data_format',
      FilterExpression: query_keys.map((key) =>
        `${dynamoKey(key)} = :${dynamoKey(key)}`
      ).join(' AND '),
      ExpressionAttributeValues: query_keys.reduce((acc, key) => {
        acc[`:${dynamoKey(key)}`] = { S: query_terms.get(key) };
        return acc;
      }, {
        ":data_format": {
          S: query_terms.get('descriptor.dataFormat') || 'none'
         }
       })
    }
  

    const query_command = new QueryCommand(query_command_input);

    const index_results =  await this.index.send(query_command);

    for (const result of index_results.Items) {
      const cid = CID.parse(result.descript0r_dataCid.S, base64.decoder);
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

    let data: string | undefined = messageJson['data'];

    const encodedBlock = await block.encode({ value: _.omit(messageJson, 'data'), codec: cbor, hasher: sha256 });

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

    const items = flatten(this.index_schema);

    items[dynamoKey('descriptor.dataFormat')] = {S: messageJson['descriptor.dataFormat'] || 'none'};
    items['message'] = { S: JSON.stringify(messageJson)}

    Array.from(items.keys()).forEach((key) => {
      const value = dig(key.split('.'), messageJson);
      if (value) {
        items[dynamoKey(key)] =  {S: value};
      }
    })

    const put_command = new PutItemCommand({  TableName: 'messages', Item: items });
    const put_result =  await this.index.send(put_command);
    console.log(put_result);
  }

  /**
   * deletes everything in the underlying datastore and indices.
   */
  async clear(): Promise<void> {
    await this.db.clear();
    await this.index.clear();
  }
}

type MessageStoreDynamoConfig = {
  injectDB?: any,
  blockstoreLocation?: string,
  indexLocation?: string,
  indexObjects?: object[]
};