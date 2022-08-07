import { DWN } from "dwn-sdk";
import express, { Application, Request, Response, NextFunction } from "express";


const app: Application = express();
app.use(express.json());
const port = 8080; // default port to listen

const config = {
  interfaces:  [{methodHandlers: [], schemas: ["SocialMediaPosting"]}]
}

// TODO: maybe wrapp this in a class
let dwn: DWN;

// define a route handler for the default home page
app.get("/ping", (req, res) => {
  res.json({ message: "DID Express JS" });
});

app.post("/", (req, res) => {
  res.json(dwn.processMessage(req.body.messages[0], {"tenant": req.body.target }));
});

// start the Express server
app.listen(port, async () => {
  console.log(`server started at http://localhost:${port}`);
  dwn = await DWN.create(config)
});

export default app;