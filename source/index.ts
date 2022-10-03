import { DWN } from "./dwn-sdk";
import express, { Application } from "express";
import createDWN from "./dwn-sdk-wrapper";

const app: Application = express();
app.use(express.json());
const port = process.env['PORT'] || 8080; // default port to listen

let dwn: DWN;

// define a route handler for the default home page
app.get("/ping", (req, res) => {
  res.json({ message: "DID Express JS" });
});

app.post("/", async (req, res) => {
  const response = await dwn.processRequest(req.body);
  res.json(response);
});

// start the Express server
app.listen(port, async () => {
  console.log(`server started at http://localhost:${port}`);
  dwn = await createDWN()
});

export default app;