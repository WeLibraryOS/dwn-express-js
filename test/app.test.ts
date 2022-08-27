import request from "supertest";

import app from "../source/index";

import { expect } from 'chai';

describe("test app running", () => {
  it("ping route", async () => {
    const res = await request(app).get("/ping");
    await expect(res.body).equal({ message: "DID Express JS" });
  });
});
