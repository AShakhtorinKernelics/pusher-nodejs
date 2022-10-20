import express, { Response, Request } from "express";
import { TickerInfo } from "../models/TickerInfo";
import axios from "axios";

const router = express.Router();

router.post("/getTickerBySymbol", async (req: Request, res: Response) => {
  try {
    const { tickerSymbol }: { tickerSymbol: string } = req.body;

    const tickerInfo = await TickerInfo.findOne({ tickerSymbol });

    res.send({
      status: "success",
      data: {
        tickerInfo,
      },
    });
  } catch (error) {
    console.error(`getTickerBySymbolReq error:: ${(error as Error).message}`);
    throw error;
  }
});

router.post("/getTickerByCompanyName", async (req: Request, res: Response) => {
  try {
    const { companyName }: { companyName: string } = req.body;

    const tickerList = await TickerInfo.find({ companyName });

    res.send({
      status: "success",
      data: {
        tickerList,
      },
    });
  } catch (error) {
    console.error(
      `getTickerByCompanyNameReq error:: ${(error as Error).message}`
    );
    throw error;
  }
});

router.get("/getAllTickers", async (req: Request, res: Response) => {
  try {
    const tickerInfoList = await TickerInfo.find({});

    res.send({
      status: "success",
      data: {
        tickerInfoList,
      },
    });
  } catch (error) {
    console.error(`getAllTicker error:: ${(error as Error).message}`);
    throw error;
  }
});

export { router as TickerRouter };
