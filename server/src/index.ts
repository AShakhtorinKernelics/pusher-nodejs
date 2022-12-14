import express from "express";
import "express-async-errors";
import { urlencoded, json } from "body-parser";
import { errorHandler, NotFoundError } from "./common/src";
import Pusher from "pusher";
import { pusherConfig } from "./utils";
import mongoose from "mongoose";
// routes
import {
  healthRouter,
  companyRouter,
  tickerRouter,
  watchlistRouter,
  chatRouterInit,
} from "./routes";

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
app.use([chatRouterInit(pusher), companyRouter, tickerRouter, watchlistRouter]);

app.get("*", () => {
  throw new NotFoundError();
});

app.use(errorHandler);

const start = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.log("MONGO URI NOT FOUND");
      throw new Error("No MONGO_URI key found");
    }
    await mongoose.connect(process.env.MONGO_URI);
  } catch (err) {
    console.log(err);
  }

  app.listen(process.env.PORT, () => {
    console.log("Pusher test server is succesfully running");
  });
};

start();
