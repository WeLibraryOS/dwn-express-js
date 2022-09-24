import type { MethodHandler } from '../../types';
import type { CollectionsQuerySchema } from '../types';
import { CollectionsQuery } from '../messages/collections-query';
import { MessageReply } from '../../../core';
import { removeUndefinedProperties } from '../../../utils/object';
import _ from 'lodash';

export const handleCollectionsQuery: MethodHandler = async (
  context,
  message,
  messageStore,
  didResolver
): Promise<MessageReply> => {
  const collectionsQueryMessage = new CollectionsQuery(message as CollectionsQuerySchema);

  try {
    await collectionsQueryMessage.verifyAuth(didResolver);
  } catch (e) {
    return new MessageReply({
      status: { code: 401, message: e.message }
    });
  }

  try {
    const validatedMessage = message as CollectionsQuerySchema;

    if (validatedMessage.descriptor.dateSort) {
      throw new Error('`dateSort` not implemented');
    }

    // query format much match message format

    const query = {
      data: validatedMessage.descriptor.filter.data,
      descriptor: {
        ...(_.omit(validatedMessage.descriptor.filter, 'data')),
        method: 'CollectionsWrite',
      }
    };
    removeUndefinedProperties(query);

    const entries = await messageStore.query(query, context);

    return new MessageReply({
      status: { code: 200, message: 'OK' },
      entries
    });
  } catch (e) {
    return new MessageReply({
      status: { code: 500, message: e.message }
    });
  }
};
