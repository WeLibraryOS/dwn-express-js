import type { AuthCreateOptions, Authorizable, AuthVerificationResult } from '../../../core/types';
import type { PermissionsRequestSchema, PermissionsRequestDescriptor } from '../types';
import type { PermissionScope, PermissionConditions } from '../types';

import { DIDResolver } from '../../../did/did-resolver';
import { Message } from '../../../core/message';
import { sign, verifyAuth } from '../../../core/auth';
import { v4 as uuidv4 } from 'uuid';

type PermissionsRequestOptions = AuthCreateOptions & {
  conditions?: PermissionConditions;
  description: string;
  grantedTo: string;
  grantedBy: string;
  permissionRequestId?: string;
  scope: PermissionScope;
};

export class PermissionsRequest extends Message implements Authorizable {
  protected message: PermissionsRequestSchema;

  constructor(message: PermissionsRequestSchema) {
    super(message);
  }

  static async create(opts: PermissionsRequestOptions): Promise<PermissionsRequest> {
    const { conditions } = opts;
    const providedConditions = conditions ? conditions : {};
    const mergedConditions = { ...DEFAULT_CONDITIONS, ...providedConditions  };

    const descriptor: PermissionsRequestDescriptor = {
      conditions  : mergedConditions,
      description : opts.description,
      grantedTo   : opts.grantedTo,
      grantedBy   : opts.grantedBy,
      method      : 'PermissionsRequest',
      permissionRequestId    : opts.permissionRequestId ? opts.permissionRequestId : uuidv4(),
      scope       : opts.scope,
    };

    const auth = await sign({ descriptor }, opts.signatureInput);
    const message: PermissionsRequestSchema = { descriptor, authorization: auth };

    return new PermissionsRequest(message);
  }

  async verifyAuth(didResolver: DIDResolver): Promise<AuthVerificationResult> {
    return await verifyAuth(this.message, didResolver);
  }

  get id(): string {
    return this.message.descriptor.permissionRequestId!;
  }

  get conditions(): PermissionConditions {
    return this.message.descriptor.conditions;
  }

  get grantedBy(): string {
    return this.message.descriptor.grantedBy;
  }

  get grantedTo(): string {
    return this.message.descriptor.grantedTo;
  }

  get description(): string {
    return this.message.descriptor.description;
  }

  get scope(): PermissionScope {
    return this.message.descriptor.scope;
  }
}

export const DEFAULT_CONDITIONS: PermissionConditions = {
  attestation  : 'optional',
  delegation   : false,
  encryption   : 'optional',
  publication  : false,
  sharedAccess : false
};