import type { Authorization, BaseMessageSchema } from '../../core/types';

export type CollectionsWriteDescriptor = {
  method: 'CollectionsWrite';
  protocol?: string;
  schema?: string;
  dataCid: string;
  dateCreated: number;
  published?: boolean;
  datePublished?: number;
  dataFormat: string;
};

export type CollectionsWriteSchema = BaseMessageSchema & Authorization & {
  descriptor: CollectionsWriteDescriptor;
};

export type CollectionsQueryDescriptor = {
  method: 'CollectionsQuery';
  filter: {
    protocol?: string;
    schema?: string;
    recordId?: string;
    dataFormat?: string;
    data?: Record<string, unknown>;
  }
  dateSort?: string;
};

export type CollectionsQuerySchema = BaseMessageSchema & Authorization & {
  descriptor: CollectionsQueryDescriptor;
};