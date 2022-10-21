import { DWN } from "./dwn-sdk";
import express, { Application } from "express";
import createDWN from "./dwn-sdk-wrapper";
import dotenv from "dotenv";
import { env } from "process";
dotenv.config();

const app: Application = express();
app.use(express.json());
const port = 8080; // default port to listen

let dwn: DWN;

// define a route handler for the default home page
app.get("/ping", (req, res) => {
  res.json({ message: "DID Express JS" });
});

app.post("/", async (req, res) => {
  if (!dwn) {
    console.log(`creating DWN`);
    dwn = await createDWN({owner: process.env.DWN_OWNER});
  }
  const response = await dwn.processRequest(req.body);
  res.json(response);
});

// start the Express server
app.listen(port, async () => {
  console.log(`server started at http://localhost:${port}`);
});

export default app;