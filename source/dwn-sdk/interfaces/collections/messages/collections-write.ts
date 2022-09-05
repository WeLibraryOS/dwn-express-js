import type { AuthCreateOptions, Authorizable, AuthVerificationResult } from '../../../core/types';
import type { CollectionsWriteDescriptor, CollectionsWriteSchema } from '../types';
import { DIDResolver } from '../../../did/did-resolver';
import { Message } from '../../../core/message';
import { removeUndefinedProperties } from '../../../utils/object';
import { sign, verifyAuth } from '../../../core/auth';
import { getDagCid } from '../../../utils/data';

type CollectionsWriteOptions = AuthCreateOptions & {
  protocol?: string;
  schema?: string;
  recordId: string;
  nonce: string;
  data: Uint8Array;
  dateCreated: number;
  published?: boolean;
  datePublished?: number;
  dataFormat: string;
};

export class CollectionsWrite extends Message implements Authorizable {
  protected message: CollectionsWriteSchema;

  constructor(message: CollectionsWriteSchema) {
    super(message);
  }

  static async create(options: CollectionsWriteOptions): Promise<CollectionsWrite> {
    const dataCid = await getDagCid(options.data);
    const descriptor: CollectionsWriteDescriptor = {
      method        : 'CollectionsWrite',
      protocol      : options.protocol,
      schema        : options.schema,
      recordId      : options.recordId,
      nonce         : options.nonce,
      dataCid       : dataCid.toString(),
      dateCreated   : options.dateCreated,
      published     : options.published,
      datePublished : options.datePublished,
      dataFormat    : options.dataFormat
    };

    // delete all descriptor properties that are `undefined` else the code will encounter the following IPLD issue when attempting to generate CID:
    // Error: `undefined` is not supported by the IPLD Data Model and cannot be encoded
    removeUndefinedProperties(descriptor);

    const authorization = await sign({ descriptor }, options.signatureInput);
    const message = { descriptor, authorization };

    return new CollectionsWrite(message);
  }

  async verifyAuth(didResolver: DIDResolver): Promise<AuthVerificationResult> {
    // TODO: Issue #75 - Add permission verification - https://github.com/TBD54566975/dwn-sdk-js/issues/75
    const verificationResult =  await verifyAuth(this.message, didResolver);
    return verificationResult
  }
}
