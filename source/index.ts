import { DWN } from "dwn-sdk";
import { Interface } from "dwn-sdk/dist/esm/interfaces/types";
import express, { Application, Request, Response, NextFunction } from "express";


const app: Application = express();
app.use(express.json());
const port = 8080; // default port to listen

const schemas = {} as { [key: string]: any };

schemas['FeatureDetectionRead'] = true;

const config = {
  interfaces:  [{methodHandlers: [], schemas: schemas}]
}

// TODO: maybe wrapp this in a class
let dwn: DWN;

// define a route handler for the default home page
app.get("/ping", (req, res) => {
  res.json({ message: "DID Express JS" });
});

app.post("/", (req, res) => {
  res.json(dwn.processRequest(req.body));
});

// start the Express server
app.listen(port, async () => {
  console.log(`server started at http://localhost:${port}`);
  dwn = await DWN.create(config)
});

export default app;