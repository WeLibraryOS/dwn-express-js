import type { DeepPartial } from '../types';
import type { GeneralJws, SignatureInput } from '../jose/jws/general/types';

import { CID } from 'multiformats/cid';
import { DIDResolver } from '../did/did-resolver';

export type DID = string;

export type BaseDescriptorSchema = {
  method: string;
  dataCid?: string;
  dataFormat?: string;
};

export type BaseProcessingSchema = {
  nonce: string;
  author: DID;
  recipient: DID
}

/**
 * Intersection type for all concrete message schema types (e.g. PermissionsRequestSchema)
 */
export type BaseMessageSchema = {
  recordId: string
  descriptor: BaseDescriptorSchema,
  processing: BaseProcessingSchema
};

export type AuthMessageSchema = BaseMessageSchema & Authorization;

/**
 * Intersection type for message schema types that include `data`
 */
export type Data = {
  descriptor: BaseDescriptorSchema

  data: string;
};

/**
 * Intersection type for all DWN message descriptor.
 */
export type Descriptor = {
  method: string;
};


export type Attestation = {
  attestation?: GeneralJws;
};

/**
 * Intersection type for message schema types that include `authorization`
 */
export type Authorization = {
  authorization: GeneralJws;
};

export type GenericMessageSchema = BaseMessageSchema & DeepPartial<Data> & Partial<Attestation> & Partial<Authorization> & {
  descriptor: {
    [key: string]: unknown;
  }
};

export type AuthVerificationResult = {
  /** DIDs of all signers */
  signers: string[];
  /** parsed JWS payload */
  payload: { descriptorCid: CID, [key: string]: CID }
};

/**
 * concrete Message classes should implement this interface if the Message contains authorization
 */
export interface Authorizable {
  /**
   * validates and verifies the `authorization` property of a given message
   * @param didResolver - used to resolve `kid`'s
   */
  verifyAuth(didResolver: DIDResolver): Promise<AuthVerificationResult>;
}

/**
 * concrete Message classes should implement this interface if the Message contains authorization
 */
export interface Attestable {
  attest(): Promise<void>;
  verifyAttestation(didResolver: DIDResolver): Promise<string>;
}

export type AuthCreateOptions = {
  signatureInput: SignatureInput
};

export type ProcessingOptions = {
  processing: {
  recipient: DID, 
  author: DID
  }
}

export type RequestSchema = {
  messages: BaseMessageSchema[]
  target: DID
};