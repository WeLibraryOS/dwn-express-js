import type { AuthCreateOptions, Authorizable, AuthVerificationResult } from '../../../core/types';
import type { PermissionsQuerySchema, PermissionsQueryDescriptor } from '../types';
import type { PermissionScope } from '../types';

import { DIDResolver } from '../../../did/did-resolver';
import { Message } from '../../../core/message';
import { sign, verifyAuth } from '../../../core/auth';

type PermissionsQueryOptions = AuthCreateOptions & PermissionsQueryDescriptor

export class PermissionsQuery extends Message implements Authorizable {
  protected message: PermissionsQuerySchema;

  constructor(message: PermissionsQuerySchema) {
    super(message);
  }

  static async create(opts: PermissionsQueryOptions): Promise<PermissionsQuery> {

    const descriptor: PermissionsQueryDescriptor = opts;

    const auth = await sign({ descriptor }, opts.signatureInput);
    const message: PermissionsQuerySchema = { descriptor, authorization: auth };

    return new PermissionsQuery(message);
  }

  async verifyAuth(didResolver: DIDResolver): Promise<AuthVerificationResult> {
    return await verifyAuth(this.message, didResolver);
  }

  get permissionRequestId(): string {
    return this.message.descriptor.permissionRequestId!;
  }

  get permissionGrantId(): string | undefined {
    return this.message.descriptor.permissionGrantId;
  }

  get permissionRevokeId(): string | undefined {
    return this.message.descriptor.permissionRevokeId;
  }

  get grantedTo(): string | undefined {
    return this.message.descriptor.grantedTo;
  }

  get grantedBy(): string | undefined {
    return this.message.descriptor.grantedBy;
  }

  get delegatedFrom(): string | undefined {
    return this.message.descriptor.delegatedFrom;
  }

  get scope(): PermissionScope | undefined {
    return this.message.descriptor.scope;
  }
}