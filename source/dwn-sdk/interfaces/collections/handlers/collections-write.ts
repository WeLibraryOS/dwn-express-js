import type { MethodHandler } from '../../types';
import type { CollectionsWriteSchema } from '../types';
import { CollectionsWrite } from '../messages/collections-write';
import { MessageReply } from '../../../core';

import { handlePermissionsQuery } from '../../permissions/handlers/permissions-query';

export const handleCollectionsWrite: MethodHandler = async (
  context,
  message,
  messageStore,
  didResolver
): Promise<MessageReply> => {
  const collectionsWriteMessage = new CollectionsWrite(message as CollectionsWriteSchema);

  let verificationResult;

  try {
    verificationResult = await collectionsWriteMessage.verifyAuth(didResolver);
  } catch (e) {
    return new MessageReply({
      status: { code: 401, message: e.message }
    });
  }


  // if there is an owner, check if the owner is the same as the signer
  if (context.owner && !verificationResult.signers.includes(context.owner)) {

    const permissions_query_message = {
      descriptor: {
        // method: 'PermissionsQuery',
        grantedTo: verificationResult.signers[0],
        grantedBy: context.owner,
        scope: {
          method: 'CollectionsWrite'
        }
      }
    }

    // the specs for PermissionQuery https://identity.foundation/decentralized-web-node/spec/#query-2 include method: 'PermissionsQuery' but you look up
    // other types of Permissions objects using the other properties of the descriptor. If you don't remove the method property, you get no results
    const permission_grants = await handlePermissionsQuery(context, permissions_query_message, messageStore, didResolver);

    if (permission_grants.entries!.length === 0) {
      return new MessageReply({
        status: { code: 401, message: 'Unauthorized' }
      });
    }
  }

  try {
    await messageStore.put(message, {author: context.tenant, tenant: context.tenant});

    return new MessageReply({
      status: { code: 202, message: 'Accepted' }
    });
  } catch (e) {
    return new MessageReply({
      status: { code: 500, message: e.message }
    });
  }
};
