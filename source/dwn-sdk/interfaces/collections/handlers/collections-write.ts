import type { MethodHandler } from '../../types';
import type { CollectionsWriteSchema } from '../types';
import { CollectionsWrite } from '../messages/collections-write';
import { MessageReply } from '../../../core';

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

    const permission_grants = await messageStore.query({scope: {method: 'CollectionsWrite'}, author: context.owner, tenant: verificationResult.signers[0]}, context);

    if (permission_grants.length === 0) {
      return new MessageReply({
        status: { code: 401, message: 'Unauthorized' }
      });
    }
  }

  try {
    await messageStore.put(message, context);

    return new MessageReply({
      status: { code: 202, message: 'Accepted' }
    });
  } catch (e) {
    return new MessageReply({
      status: { code: 500, message: e.message }
    });
  }
};
