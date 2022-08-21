import { CollectionsQuery } from './messages/collections-query';
import { CollectionsWrite } from './messages/collections-write';
import { handleCollectionsQuery } from './handlers/collections-query';
import { handleCollectionsWrite } from './handlers/collections-write';
import { Interface } from '../types';

export const CollectionsInterface: Interface = {
  name: "collections",
  methodHandlers: {
    'CollectionsQuery' : handleCollectionsQuery,
    'CollectionsWrite' : handleCollectionsWrite
  },
  schemas: {},
  messages: [
    CollectionsQuery,
    CollectionsWrite
  ]
};