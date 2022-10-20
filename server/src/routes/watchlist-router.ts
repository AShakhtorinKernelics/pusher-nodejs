import express, { Response, Request } from "express";
import { UserStockList } from "../models/UserStockList";
import { StockWatchers } from "../models/StockWatchers";

const router = express.Router();

router.post("/userStockList", async (req: Request, res: Response) => {
  try {
    const { userId }: { userId: string } = req.body;

    const userStockWatchlist = await UserStockList.findOne({ userId });

    res.send({
      status: "success",
      data: {
        stockSymbolList: userStockWatchlist
          ? userStockWatchlist.stockSymbolList
          : [],
      },
    });
  } catch (error) {
    console.error(`userStockListReq error:: ${(error as Error).message}`);
    throw error;
  }
});

router.post("/addToWatchlist", async (req: Request, res: Response) => {
  try {
    const { userId, stockSymbol }: { userId: string; stockSymbol: string } =
      req.body;

    const userStockWatchlist = await UserStockList.findOne({ userId });

    if (userStockWatchlist) {
      userStockWatchlist.stockSymbolList.push(stockSymbol);
      await userStockWatchlist.save();
    } else {
      const newWatchlist = UserStockList.build({
        userId,
        stockSymbolList: [stockSymbol],
      });
      await newWatchlist.save();
    }

    const stockWatchersList = await StockWatchers.findOne({ stockSymbol });

    if (stockWatchersList) {
      stockWatchersList.connectedUserIdList.push(userId);

      await stockWatchersList.save();
    } else {
      const newStockWatchersList = StockWatchers.build({
        stockSymbol,
        connectedUserIdList: [userId],
      });

      await newStockWatchersList.save();
    }

    res.send({
      status: "success",
      data: {
        stockIdList: userStockWatchlist
          ? userStockWatchlist.stockSymbolList
          : [stockSymbol],
      },
    });
  } catch (error) {
    console.error(`addToWatchlistReq error:: ${(error as Error).message}`);
    throw error;
  }
});

export { router as WatchlistRouter };
