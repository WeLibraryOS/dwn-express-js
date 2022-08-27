import type { Context } from '../types';
import type { BaseMessageSchema } from '../core/types';

import { CID } from 'multiformats/cid';
import { MessageStore } from './message-store';

export class MessageStoreMem implements MessageStore {
  /**
   * opens a connection to the underlying store
   */
  async open(): Promise<void>  {
    return;
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
    return;
  }
  /**
   * fetches a single message by `cid` from the underlying store. Returns `undefined`
   * if no message was found
   * @param cid
   */
  async get(cid: CID, ctx: Context): Promise<BaseMessageSchema> {
    return {
      descriptor: {
        method: 'string'
      }
    };
  }
  /**
   * queries the underlying store for messages that match the query provided.
   * returns an empty array if no messages are found
   * @param query
   */
  async query(query: any, ctx: Context): Promise<BaseMessageSchema[]> {
    return [{
      descriptor: {
        method: 'string'
      }
    }];
  }

  /**
   * deletes the message associated to the id provided
   * @param cid
   */
  async delete(cid: CID, ctx: Context): Promise<void> {
    return;
  }
}