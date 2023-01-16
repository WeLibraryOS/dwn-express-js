import type { Authorization, BaseMessageSchema, ProcessingOptions } from '../../core/types';

export type PermissionScope = {
  method: string
  schema?: string
  objectId?: string
};

export type PermissionConditions = {
  // attestation indicates whether any inbound data should be signed.
  // defaults to `optional`
  attestation?: 'optional' | 'prohibited' | 'required'

  // delegation indicates that a given permission can be delegated to other entities.
  // defaults to `false`
  delegation?: boolean,

  // encryption indicates whether any inbound data should be encrypted.
  // defaults to 'optional'
  encryption?: 'optional' | 'required'

  // indicates whether a message written with the invocation of a permission can
  // be marked as public. public messages can be queried for without any authorization
  // defaults to false.
  publication?: boolean

  // sharedAccess indicates whether the requester has access to records authored
  // by others. False indicates that the requester only has access to records
  // they authored.
  // defaults to `false`
  sharedAccess?: boolean
};

export type PermissionsRequestDescriptor = {
  conditions: PermissionConditions
  description: string
  grantedTo: string
  grantedBy: string
  method: 'PermissionsRequest'
  permissionRequestId?: string
  scope: PermissionScope
};

export type PermissionsRequestSchema = BaseMessageSchema & Authorization & ProcessingOptions & {
  descriptor: PermissionsRequestDescriptor;
};

export type PermissionsGrantDescriptor = {
  conditions: PermissionConditions;
  delegatedFrom?: string;
  description: string;
  grantedTo: string;
  grantedBy: string;
  method: 'PermissionsGrant';
  permissionsRequestId?: string;
  permissionsGrantId?: string;
  scope: PermissionScope;
};

export type PermissionsGrantSchema = BaseMessageSchema & Authorization & {
  descriptor: PermissionsGrantDescriptor;
  delegationChain?: PermissionsGrantSchema;
};

export type PermissionsQueryDescriptor = {
  method: 'PermissionsQuery',
  permissionRequestId?: string,
  permissionGrantId?: string,
  permissionRevokeId?: string,
  grantedTo?: string,
  grantedBy?: string,
  delegatedFrom?: string,
  scope?: PermissionScope
};

export type PermissionsQuerySchema = BaseMessageSchema & Authorization & {
  descriptor: PermissionsQueryDescriptor;
};