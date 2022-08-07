import request from "supertest";

import app from "../source/index";

describe("test app running", () => {
  test("ping route", async () => {
    const res = await request(app).get("/ping");
    await expect(res.body).toEqual({ message: "DID Express JS" });
  });
});
