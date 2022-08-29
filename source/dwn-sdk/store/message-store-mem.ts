import type { Context } from '../types';
import type { BaseMessageSchema } from '../core/types';

import { CID } from 'multiformats/cid';
import { MessageStore } from './message-store';

import { sha256 } from 'multiformats/hashes/sha2';

import * as cbor from '@ipld/dag-cbor';
import * as block from 'multiformats/block';

import * as memstore from 'memstore';

export class MessageStoreMem implements MessageStore {

  store: memstore.Store;

  /**
   * opens a connection to the underlying store
   */
  async open(): Promise<void>  {
    this.store = new memstore.Store();
  }
  /**
   * closes the connection to the underlying store
   */
  async close(): Promise<void> {
    return;
  }
  /**
   * adds a message to the underlying store. Uses the message's cid as the key
   * @param messageJson
   */
  async put(messageJson: BaseMessageSchema, ctx: Context): Promise<void> {
    const encodedBlock = await block.encode({ value: messageJson, codec: cbor, hasher: sha256 });
    this.store.set(encodedBlock.cid, messageJson);
  }
  /**
   * fetches a single message by `cid` from the underlying store. Returns `undefined`
   * if no message was found
   * @param cid
   */
  async get(cid: CID, ctx: Context): Promise<BaseMessageSchema> {
    return this.store.get(cid);   
  }
  /**
   * queries the underlying store for messages that match the query provided.
   * returns an empty array if no messages are found
   * @param query
   */
  async query(query: any, ctx: Context): Promise<BaseMessageSchema[]> {
    return this.store.map((value, key, obj)  => { 
      // TODO: filter here
      return value;
    });
  }

  /**
   * deletes the message associated to the id provided
   * @param cid
   */
  async delete(cid: CID, ctx: Context): Promise<void> {
    this.store.delete(cid);
  }
}