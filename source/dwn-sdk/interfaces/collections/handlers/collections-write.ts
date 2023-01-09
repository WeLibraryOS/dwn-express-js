import type { MethodHandler } from '../../types';
import type { CollectionsWriteSchema } from '../types';
import { CollectionsWrite } from '../messages/collections-write';
import { MessageReply } from '../../../core';
import { verifyPermission } from '../../../core/permission';

export const handleCollectionsWrite: MethodHandler = async (
  context,
  message,
  messageStore,
  didResolver
): Promise<MessageReply> => {
  const collectionsWriteMessage = new CollectionsWrite(message);

  let verificationResult;

  try {
    verificationResult = await collectionsWriteMessage.verifyAuth(didResolver);
  } catch (e) {
    return new MessageReply({
      status: { code: 401, message: e.message }
    });
  }


  // if there is an owner, check if the owner is the same as the signer
  // TODO: check if one of the signers have permission or all of the signers?
  if (context.owner && !verificationResult.signers.includes(context.owner) && !await verifyPermission(verificationResult.signers[0], context, 'CollectionsWrite', messageStore, didResolver)) {
    return new MessageReply({
      status: { code: 401, message: 'Unauthorized' }
    });
  }

    await messageStore.put(message, {author: context.author, recipient: context.recipient});

    return new MessageReply({
      status: { code: 202, message: 'Accepted' }
    });
};
