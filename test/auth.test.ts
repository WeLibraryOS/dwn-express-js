
import { GeneralJwsSigner, GeneralJwsVerifier } from '../source/dwn-sdk/jose/jws/general';

describe("test signer", () => {

  test("just payload", async () => {
    const signer = await GeneralJwsSigner.create(new TextEncoder().encode("hello darkness my old friend"));
    // await expect(signer.getJws().payload).toBeDefined();
  });
});
