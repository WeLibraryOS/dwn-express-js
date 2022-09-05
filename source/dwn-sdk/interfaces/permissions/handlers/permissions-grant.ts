import type { MethodHandler } from '../../types';
import type { PermissionsGrantSchema } from '../types';

import { MessageReply } from '../../../core';
import { PermissionsGrant } from '../messages/permissions-grant';

export const handlePermissionsGrant: MethodHandler = async (
  ctx,
  message,
  messageStore,
  didResolver
): Promise<MessageReply> => {
  const request = new PermissionsGrant(message as PermissionsGrantSchema);

  if (ctx.tenant !== request.grantedBy && ctx.tenant !== request.grantedTo) {
    return new MessageReply({
      status: { code: 400, message: 'grantedBy or grantedTo must be the targeted message recipient' }
    });
  }

  // TODO: should we add an explicit check to ensure that there's only 1 signer?, Issue #65 https://github.com/TBD54566975/dwn-sdk-js/issues/65
  const { signers } = await request.verifyAuth(didResolver);
  const [ signer ] = signers;

  if (signer !== request.grantedBy) {
    throw new Error('grantor must be signer');
  }

  try {
    await messageStore.put(message, ctx);

    return new MessageReply({
      status: { code: 202, message: 'Accepted' }
    });
  } catch (e) {
    return new MessageReply({
      status: { code: 500, message: e.message }
    });
  }
};