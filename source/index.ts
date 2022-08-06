import { DWN } from "dwn-sdk";
import express, { Application, Request, Response, NextFunction } from "express";


const app: Application = express();
const port = 8080; // default port to listen

// define a route handler for the default home page
app.get("/", (req, res) => {
  res.json({ message: "DID Express JS" });
});

// start the Express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
  console.log(DWN);
});

export default app;