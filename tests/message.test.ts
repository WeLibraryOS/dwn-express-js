import request from "supertest";

import app from "../source/index";

describe("test message handling", () => {
  test("default route", async () => {
    const res = await request(app).post("/").send(
      {
        "target": "did:example:123",
        "messages": [
          {
            "descriptor": {
              "nonce": "9b9c7f1fcabfc471ee2682890b58a427ba2c8db59ddf3c2d5ad16ccc84bb3106",
              "method": "CollectionsQuery",
              "schema": "https://schema.org/SocialMediaPosting"
            },
            "data": {
              "@context":"https://schema.org",
              "@type":"SocialMediaPosting",
              "@id":"https://www.pinterest.com/pin/201887995769400347/",
              "datePublished":"2014-03-04",
              "author":{
                  "@type":"Person",
                  "name":"Ryan Sammy",
                  "url":"https://www.pinterest.com/ryansammy/"
              },
              "headline":"Leaked new BMW 2 series (m235i)",
              "sharedContent":{
                  "@type":"WebPage",
                  "headline":"Leaked new BMW 2 series (m235i) ahead of oct 25 reveal",
                  "url":"http://www.reddit.com/r/BMW/comments/1oyh6j/leaked_new_bmw_2_series_m235i_ahead_of_oct_25/",
                  "author":{
                  "@type":"Person",
                  "name":"threal135i"
                  }
              }
              }
          }
        ]
      }
    );
    await expect(res.body).toEqual({ message: "DID Express JS" });
  });
});
