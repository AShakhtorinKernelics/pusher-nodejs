import express, { Response, Request } from "express";
import { TickerInfo } from "../models/TickerInfo";
import axios from "axios";
import { StockWatchers } from "../models/StockWatchers";
import { UserWatchList } from "../models/UserWatchList";

const router = express.Router();

router.post("/updateTickerInfoInDb", async (req: Request, res: Response) => {
  try {
    //   const { listOfTickers, listOfFilters }: { listOfTickers: string[], listOfFilters: string[] } = req.body;

    const listOfTickers = ["AAPL", "FB", "TSLA"];

    const listOfFilters = [
      "symbol",
      "companyName",
      "peRatio",
      "day5ChangePercent",
      "dividendYield",
    ];

    const stockList = listOfTickers.join(",");
    const token = "sk_d49e4fe09bd64537913bf4f1c00adc2d";
    const dataFilters = listOfFilters.join(",");
    const updatedData = await axios.get(
      `https://cloud.iexapis.com/v1/stock/market/stats?symbols=${stockList}&filter=${dataFilters}&token=${token}`
    );

    // const tempUserObj: { [key: string]: string[] } = {};

    const tickerDataToInsert = updatedData.data.map(
      (tickerData: any, index: number) => {
        /* const tempWatchData = await StockWatchers.findOne({
          stockSymbol: listOfTickers[index],
        });

        if (tempWatchData) {
          tempWatchData.connectedUserIdList.forEach((userId: string) => {
            if (tempUserObj[userId]) {
              tempUserObj[userId].push(tickerData.tickerSymbol);
            } else {
              tempUserObj[userId] = [tickerData.tickerSymbol];
            }
          });
        } */

        return {
          tickerSymbol: listOfTickers[index],
          companyName: tickerData.companyName.trim(),
          peRatio: tickerData.peRatio,
          day5ChangePercent: tickerData.day5ChangePercent,
          dividendYield: tickerData.dividendYield,
        };
      }
    );

    const { tickerInfoList, successCount, errorCount } =
      await TickerInfo.replaceAllWithNewValues(tickerDataToInsert);

    console.log(`successCount: ${successCount}`);
    console.log(`errorCount: ${errorCount}`);

    /* if (successCount) {
      Object.keys(tempUserObj).forEach(async (key) => {
        const userWatchList = await UserWatchList.findOne({
          userId: key,
        });

        if (userWatchList) {
          let stockIndex;
          userWatchList.stockSymbolList.forEach((stock, index: number) => {
            tempUserObj[key].find((obj) => obj === stock.tickerSymbol);
          });

          if () {

          }
        }
      });
    } */

    res.send({
      status: "success",
      data: {
        tickerInfoList,
      },
    });
  } catch (error) {
    console.error(
      `updateTickerInfoInDbReq error:: ${(error as Error).message}`
    );
    throw error;
  }
});

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

export { router as tickerRouter };
