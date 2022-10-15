import express, { Response, Request } from "express";
import { Connection } from "../models/Connection";
import { Company } from "../models/Company";
import { ArchivedConnectionData } from "../models/ArchivedConnectionData";

const router = express.Router();

router.get("/api/health", async (req: Request, res: Response) => {
  console.log("health request");

  const archivedConnectionData = new ArchivedConnectionData({
    connectionId: "connectionId",
    requesters: [],
  });

  console.log("connectionRequestData Data");
  console.log(archivedConnectionData);

  await archivedConnectionData.save();

  console.log("find Company Data");
  const foundData = await ArchivedConnectionData.findOne({
    connectionId: "connectionId",
  });

  console.log("foundData");
  console.log(foundData);
  /* 
  foundData?.requesters.push({
    userId: "testUSerID",
    userName: "testUserName",
  }); */

  console.log(foundData?.toJSON());

  res.status(200).send("Email service is alive");
});

export { router as healthRouter };
