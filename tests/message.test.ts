import createDWN from "../source/dwn-sdk-wrapper";
import { MessageStoreMem } from "../source/dwn-sdk/store/message-store-mem";

describe("test message handling", () => {
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
    const dwn = await createDWN({messageStore: new MessageStoreMem()});
    const res = await dwn.processRequest(messageBody);
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(200);
  });
});
