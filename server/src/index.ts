import express from "express";
import "express-async-errors";
import { urlencoded, json } from "body-parser";
import { errorHandler, NotFoundError } from "./common/src";
import Pusher from "pusher";
import { pusherConfig } from "./utils";
// routes
import { healthRouter, chatRouterInit } from "./routes";

import cors from "cors";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(__dirname, ".env"),
});

const app = express();
app.set("trust proxy", true);
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
  })
);
app.use(urlencoded({ extended: false }));
app.use(json());

app.use(healthRouter);

const pusher = new Pusher(pusherConfig());
app.use(chatRouterInit(pusher));

app.get("*", () => {
  throw new NotFoundError();
});

app.use(errorHandler);

const start = async () => {
  try {
  } catch (err) {
    console.log(err);
  }

  app.listen(process.env.PORT, () => {
    console.log("Pusher test server is succesfully running");
  });
};

start();
