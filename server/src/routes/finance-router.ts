/* router.get("/getAllTickers", async (req: Request, res: Response) => {
    try {
      const tickerInfoList = await TickerInfo.find({});

      // pusher.trigger(requesterId, MQEventNamesEnum.getRequesters, {
      // requesters: [...requesterList],
      // });

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

  router.post("/getTickerInfoById", async (req: Request, res: Response) => {
    try {
      const { tickerId }: { tickerId: string } = req.body;

      const tickerInfo = await TickerInfo.findOne({ tickerId });

      // pusher.trigger(requesterId, MQEventNamesEnum.getRequesters, {
      // requesters: [...requesterList],
      // });

      res.send({
        status: "success",
        data: {
          tickerInfo,
        },
      });
    } catch (error) {
      console.error(`getTIckerInfoByIdReq error:: ${(error as Error).message}`);
      throw error;
    }
  });

  router.post("/getCompanyById", async (req: Request, res: Response) => {
    try {
      const { companyId }: { companyId: string } = req.body;

      const companyInfo = await Company.findOne({ companyId });

      // pusher.trigger(requesterId, MQEventNamesEnum.getRequesters, {
      // requesters: [...requesterList],
      // });

      res.send({
        status: "success",
        data: {
          companyInfo,
        },
      });
    } catch (error) {
      console.error(`getCompanyById error:: ${(error as Error).message}`);
      throw error;
    }
  });

  router.post("/userStockList", async (req: Request, res: Response) => {
    try {
      const { userId }: { userId: string } = req.body;

      const stockList = await UserStockList.findOne({ userId });

      // pusher.trigger(requesterId, MQEventNamesEnum.getRequesters, {
      // requesters: [...requesterList],
      // });

      res.send({
        status: "success",
        data: {
          stockList,
        },
      });
    } catch (error) {
      console.error(`userStockList error:: ${(error as Error).message}`);
      throw error;
    }
  }); */
