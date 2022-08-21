import { PermissionsRequest } from './messages/permissions-request';
import { handlePermissionsRequest } from './handlers/permissions-request';
import { Interface } from '../types';

export const PermissionsInterface: Interface = {
  name: "permissions",
  methodHandlers : { 'PermissionsRequest': handlePermissionsRequest },
  schemas: {},
  messages       : [ PermissionsRequest ]
};