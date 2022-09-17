import type { MethodHandler } from '../../types';
import type { PermissionsQuerySchema } from '../types';

import { MessageReply } from '../../../core';
import { PermissionsQuery } from '../messages/permissions-query';

export const handlePermissionsQuery: MethodHandler = async (
  ctx,
  message,
  messageStore,
  didResolver
): Promise<MessageReply> => {
  const request = new PermissionsQuery(message as PermissionsQuerySchema);

  // TODO: turn request into query_terms

  const query_terms = {}

  try {
    const query_results = await messageStore.query(query_terms, ctx);

    return new MessageReply({
      entries: query_results,
      status: { code: 0, message: 'Query result' }
    });
  } catch (e) {
    return new MessageReply({
      status: { code: 500, message: e.message }
    });
  }
};