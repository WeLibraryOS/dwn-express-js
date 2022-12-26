import type { AuthCreateOptions, AuthMessageSchema, BaseDescriptorSchema, BaseMessageSchema, BaseProcessingSchema, GenericMessageSchema, ProcessingOptions } from './types';

import lodash from 'lodash';
import { validate } from '../validation/validator';
import { randomUUID } from 'crypto';
import { getDagCid } from '../utils/data';
import { Context } from '../types';
import { sign } from './auth';

const { cloneDeep, isPlainObject } = lodash;
export abstract class Message {
  constructor(protected message: BaseMessageSchema) {}

  static parse(rawMessage: object): BaseMessageSchema {
    const descriptor = rawMessage['descriptor'];
    if (!descriptor) {
      throw new Error('message must contain descriptor');
    }

    if (!isPlainObject(descriptor)) {
      throw new Error('descriptor: must be object');
    }

    const messageType = descriptor['method'];
    if (!messageType) {
      throw new Error('descriptor must contain method');
    }

    // TODO: add validation for processing

    // validate throws an error if message is invalid
    validate(messageType, rawMessage);

    return rawMessage as BaseMessageSchema;
  };

  getMethod(): string {
    return this.message.descriptor.method;
  }

  toObject(): BaseMessageSchema {
    return cloneDeep(this.message);
  }

  toJSON(): BaseMessageSchema {
    return this.message;
  }
}

export async function makeRecordId(descriptor: BaseDescriptorSchema, processing: BaseProcessingSchema): Promise<string> {
  const recordIdGen = {
    descriptorCid: await (await getDagCid(descriptor)).toString(),
    processingCid: await (await getDagCid(processing)).toString()
  }
  return (await getDagCid(recordIdGen)).toString();
}

export function makeProcessing(options: ProcessingOptions): BaseProcessingSchema {
  return {
    nonce: randomUUID(),
    recipient: options.processing.recipient,
    author: options.processing.author,
  }
}

export async function makeFinalMessage<T extends BaseDescriptorSchema, V extends AuthMessageSchema>(descriptor: T, options: AuthCreateOptions & ProcessingOptions): Promise<Pick<V, 'descriptor' | 'processing' | 'recordId' | 'authorization'>> {
  const processing = makeProcessing(options);
  const recordId = await makeRecordId(descriptor, processing);
  const authorization = await sign(descriptor , options.signatureInput);

  return {
    descriptor,
    processing,
    recordId,
    authorization
  }
}