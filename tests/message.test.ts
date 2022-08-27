import { DWN } from "../source/dwn-sdk";
import createDWN from "../source/dwn-sdk-wrapper";
import { MessageStoreMem } from "../source/dwn-sdk/store/message-store-mem";

describe("test message handling", () => {

  let dwn: DWN;

  beforeAll(async () => {
    dwn = await createDWN({
      messageStore: new MessageStoreMem(),
    });
  });

  test("feature detection", async () => {
    const messageBody  = {
      "target": "did:example:123",
      "messages": [
        {
            "descriptor": {
                "nonce": "9b9c7f1fcabfc471ee2682890b58a427ba2c8db59ddf3c2d5ad16ccc84bb3106",
                "method": "FeatureDetectionRead"
            }
        }
      ]
    }
    const res = await dwn.processRequest(messageBody);
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(200);
  });

  test("collection query", async () => {
    const messageBody  = {
      "target": "did:example:123",
      "messages": [
        {
          "descriptor": {
            "nonce": "9b9c7f1fcabfc471ee2682890b58a427ba2c8db59ddf3c2d5ad16ccc84bb3106",
            "method": "CollectionsQuery",
            "filter": {"dataFormat": "json"}
          },
          "authorization": {
            "payload": "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
            "signatures": [{
              "protected": "f454w56e57r68jrhe56gw45gw35w65w4f5i54c85j84wh5jj8h5",
              "signature": "5678nr67e56g45wf546786n9t78r67e45657bern797t8r6e5"
            }]
          }
        }
      ]
    }
    const res = await dwn.processRequest(messageBody);
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(200);
  })

});
