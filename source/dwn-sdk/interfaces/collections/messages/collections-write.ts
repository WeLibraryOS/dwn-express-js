import type { AuthCreateOptions, Authorizable, AuthVerificationResult, ProcessingOptions } from '../../../core/types';
import type { CollectionsWriteDescriptor, CollectionsWriteSchema } from '../types';
import { DIDResolver } from '../../../did/did-resolver';
import { makeProcessing, makeRecordId, Message } from '../../../core/message';
import { removeUndefinedProperties } from '../../../utils/object';
import { sign, verifyAuth } from '../../../core/auth';
import { getDagCid } from '../../../utils/data';

type CollectionsWriteOptions = AuthCreateOptions & ProcessingOptions & {
  protocol?: string;
  schema?: string;
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
    this.message = message;
  }

  static async create(options: CollectionsWriteOptions): Promise<CollectionsWrite> {
    const dataCid = await getDagCid(options.data);
    const descriptor: CollectionsWriteDescriptor = {
      method        : 'CollectionsWrite',
      protocol      : options.protocol,
      schema        : options.schema,
      dataCid       : dataCid.toString(),
      dateCreated   : options.dateCreated,
      published     : options.published,
      datePublished : options.datePublished,
      dataFormat    : options.dataFormat
    };

    // delete all descriptor properties that are `undefined` else the code will encounter the following IPLD issue when attempting to generate CID:
    // Error: `undefined` is not supported by the IPLD Data Model and cannot be encoded
    removeUndefinedProperties(descriptor);

    const processing = await makeProcessing(options);

    const recordId = await makeRecordId(descriptor, processing);

    const authorization = await sign(descriptor , options.signatureInput);
    const message = { descriptor, processing, authorization, recordId };

    return new CollectionsWrite(message);
  }

  async verifyAuth(didResolver: DIDResolver): Promise<AuthVerificationResult> {
    // TODO: Issue #75 - Add permission verification - https://github.com/TBD54566975/dwn-sdk-js/issues/75
    const verificationResult =  await verifyAuth(this.message, didResolver);
    return verificationResult
  }
}
