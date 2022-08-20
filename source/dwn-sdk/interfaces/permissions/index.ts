import { PermissionsRequest } from './messages/permissions-request';
import { handlePermissionsRequest } from './handlers/permissions-request';

export const PermissionsInterface = {
  name: "permissions",
  methodHandlers : { 'PermissionsRequest': handlePermissionsRequest },
  schemas: [],
  messages       : [ PermissionsRequest ]
};