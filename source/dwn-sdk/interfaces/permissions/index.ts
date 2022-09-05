import { PermissionsRequest } from './messages/permissions-request';
import { handlePermissionsRequest } from './handlers/permissions-request';
import { Interface } from '../types';
import { PermissionsGrant } from './messages/permissions-grant';
import { handlePermissionsGrant } from './handlers/permissions-grant';

export const PermissionsInterface: Interface = {
  name: "permissions",
  methodHandlers : { 'PermissionsRequest': handlePermissionsRequest, 'PermissionsGrant': handlePermissionsGrant },
  schemas: {},
  messages       : [ PermissionsRequest, PermissionsGrant ]
};