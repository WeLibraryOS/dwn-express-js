import { CollectionsQuery } from './messages/collections-query';
import { CollectionsWrite } from './messages/collections-write';
import { handleCollectionsQuery } from './handlers/collections-query';
import { handleCollectionsWrite } from './handlers/collections-write';

export const CollectionsInterface = {
  name: "collections",
  methodHandlers: {
    'CollectionsQuery' : handleCollectionsQuery,
    'CollectionsWrite' : handleCollectionsWrite
  },
  schemas: [],
  messages: [
    CollectionsQuery,
    CollectionsWrite
  ]
};