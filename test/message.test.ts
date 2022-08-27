import request from "supertest";

import app from "../source/index";

describe("test message handling", () => {
  it("feature detection", async () => {
    const res = await request(app).post("/").send(
      {
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
    );
    await expect(res.body).equal({ message: "DID Express JS" });
  });
});
