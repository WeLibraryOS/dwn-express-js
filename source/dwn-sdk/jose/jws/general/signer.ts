import type { GeneralJws, SignatureInput } from './types';

import { base64url } from 'multiformats/bases/base64';
import { signers } from '../../algorithms';
import { TextEncoder } from "util";

export class GeneralJwsSigner {
  private jws: GeneralJws;

  constructor(jws: GeneralJws) {
    this.jws = jws;
  }

  static async create(payload: Uint8Array, signatureInputs: SignatureInput[] = []): Promise<GeneralJwsSigner> {
    const jws: GeneralJws = {
      payload    : base64url.baseEncode(payload),
      signatures : []
    };

    const signer = new GeneralJwsSigner(jws);

    for (const signatureInput of signatureInputs) {
      await signer.addSignature(signatureInput);
    }

    return signer;
  }

  static makeBase64UrlStringFromObject(o: object): string {
    const jsonString = JSON.stringify(o);
    const bytes = new TextEncoder().encode(jsonString);
    const base64 = base64url.baseEncode(bytes);
    return base64
  } 

  async addSignature(signatureInput: SignatureInput): Promise<void> {
    const { jwkPrivate, protectedHeader } = signatureInput;
    const signer = signers[jwkPrivate.crv];

    if (!signer) {
      throw new Error(`unsupported crv. crv must be one of ${Object.keys(signers)}`);
    }

    const protectedHeaderBase64UrlString = GeneralJwsSigner.makeBase64UrlStringFromObject(protectedHeader);

    const signingInputBase64urlString = `${protectedHeaderBase64UrlString}.${this.jws.payload}`;
    const signingInputBytes = new TextEncoder().encode(signingInputBase64urlString);

    const signatureBytes = await signer.sign(signingInputBytes, jwkPrivate);
    const signature = base64url.baseEncode(signatureBytes);

    this.jws.signatures.push({ protected: protectedHeaderBase64UrlString, signature });
  }

  getJws(): GeneralJws {
    return this.jws;
  }
}