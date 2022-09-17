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
        method: 'PermissionsQuery',
        grantedTo: verificationResult.signers[0],
        grantedBy: context.owner,
        scope: {
          method: 'CollectionsWrite'
        }
      }
    }

    // TODO: use PermissionsQuery here to check if the signer is allowed to write to the collection
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
