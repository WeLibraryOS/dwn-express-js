import { DIDResolver } from "../did/did-resolver";
import { handlePermissionsQuery } from "../interfaces/permissions/handlers/permissions-query";
import { PermissionsRequest } from "../interfaces/permissions/messages/permissions-request";
import { MessageStore } from "../store/message-store";
import { Context } from "../types";
import { BaseMessageSchema } from "./types";

export async function verifyPermission(grantedTo: string, context: Context, whichPermission: string, messageStore: MessageStore, didResolver: DIDResolver) {
    const permissions_query_message = {
        descriptor: {
          method: 'PermissionsGrant',
          grantedTo: grantedTo,
          grantedBy: context.owner,
          scope: {
            method: whichPermission
          }
        }
      }
  
      // the specs for PermissionQuery https://identity.foundation/decentralized-web-node/spec/#query-2 include method: 'PermissionsQuery' but you look up
      // other types of Permissions objects using the other properties of the descriptor. If you don't remove the method property, you get no results
      const permission_grants = await handlePermissionsQuery(context, permissions_query_message, messageStore, didResolver);

      return permission_grants.entries!.length != 0
}

export async function grantPermissionsRequest(ctx: Context, request: PermissionsRequest, messageStore: MessageStore, didResolver: DIDResolver) {

    // TODO: what are the rules about whether to grant permissions?
    
    const permissions_grant_message = {
        descriptor: {
          method: 'PermissionsGrant',
          grantedTo: request.grantedTo,
          grantedBy: request.grantedBy,
          scope: {
            method: request.scope.method
          }
        }
      }
  
      await messageStore.put(permissions_grant_message, ctx);
}