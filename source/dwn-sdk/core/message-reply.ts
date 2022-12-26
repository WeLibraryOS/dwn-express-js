import { BaseMessageSchema, Descriptor } from './types';

type Status = {
  code: number
  message: string
};

type MessageReplyEntry = {
  descriptor: Descriptor
}

type MessageReplyOptions = {
  status: Status,
  entries?: MessageReplyEntry[];
};

export class MessageReply {
  status: Status;
  // resulting message entries returned from the invocation of the corresponding message
  // e.g. the resulting messages from a CollectionsQuery
  entries?: MessageReplyEntry[];

  constructor(opts: MessageReplyOptions) {
    const { status, entries } = opts;

    this.status = status;
    this.entries = entries;
  }
}