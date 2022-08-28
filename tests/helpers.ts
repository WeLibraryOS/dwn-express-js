import { secp256k1 } from "../source/dwn-sdk/jose/algorithms/signing/secp256k1";
import { GeneralJwsSigner, GeneralJwsVerifier } from "../source/dwn-sdk/jose/jws/general";
import { GeneralJws } from "../source/dwn-sdk/jose/jws/general/types";
import { generateCid } from "../source/dwn-sdk/utils/cid";

export type TestJWS = {
    jws: GeneralJws;
    publicJwk: JsonWebKey;
}

export async function makeTestJWS(payload: object): Promise<TestJWS> {
    const cid = await generateCid(payload);
    const { privateJwk, publicJwk } = await secp256k1.generateKeyPair();
    const payloadBytes = new TextEncoder().encode(JSON.stringify({descriptorCid: cid.toV1().toString()}));
    const protectedHeader = { alg: 'ES256K', kid: 'did:jank:alice#key1' };

    const signer = await GeneralJwsSigner.create(payloadBytes, [{ jwkPrivate: privateJwk, protectedHeader }]);
    return {jws: signer.getJws(), publicJwk: publicJwk};
}
