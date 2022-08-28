import { DWN } from "../source/dwn-sdk";
import createDWN from "../source/dwn-sdk-wrapper";
import { MessageStoreMem } from "../source/dwn-sdk/store/message-store-mem";
import { makeTestJWS } from "./helpers";

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

    const descriptor = {
      "nonce": "9b9c7f1fcabfc471ee2682890b58a427ba2c8db59ddf3c2d5ad16ccc84bb3106",
      "method": "CollectionsQuery",
      "filter": {"dataFormat": "json"}
    };

    const {jws, publicJwk} = await makeTestJWS(descriptor);
    
    const messageBody  = {
      "target": "did:example:123",
      "messages": [
        {
          "descriptor": descriptor,
          "authorization": jws
        }
      ]
    }
    const res = await dwn.processRequest(messageBody);
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(200);
  })

});
