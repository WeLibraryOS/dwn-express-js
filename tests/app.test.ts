import request from "supertest";

import app from "../source/index";

describe("Test app.ts", () => {
  test("default route", async () => {
    const res = await request(app).get("/");
    expect(res.body).toEqual({ message: "DID Express JS" });
  });
});
