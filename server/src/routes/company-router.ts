import express, { Response, Request } from "express";
import { Company } from "../models/Company";
import axios from "axios";

const router = express.Router();

/* router.post("/updateCompanyInfoInDb", async (req: Request, res: Response) => {
  try {
    //   const { listOfTickers, listOfFilters }: { listOfTickers: string[], listOfFilters: string[] } = req.body;

    const listOfTickers = ["AAPL", "FB", "TSLA"];
    const listOfFilters = ["symbol", "industry", "companyName"];

    const stockList = listOfTickers.join(",");
    const token = "sk_d49e4fe09bd64537913bf4f1c00adc2d";
    const dataFilters = listOfFilters.join(",");
    const updatedData = await axios
      .get(
        `https://cloud.iexapis.com/v1/stock/market/company?symbols=${stockList}&filter=${dataFilters}&token=${token}`
      );

    const companyInfo = await Company.upsertAll({ companyId });

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
}); */

router.post("/getCompanyBySymbol", async (req: Request, res: Response) => {
  try {
    const { companySymbol }: { companySymbol: string } = req.body;

    const companyInfo = await Company.findOne({ companySymbol });

    res.send({
      status: "success",
      data: {
        companyInfo,
      },
    });
  } catch (error) {
    console.error(`getCompanyBySymbolReq error:: ${(error as Error).message}`);
    throw error;
  }
});

router.post("/getCompanyByIndustry", async (req: Request, res: Response) => {
  try {
    const { industry }: { industry: string } = req.body;

    const companyList = await Company.find({ industry });

    res.send({
      status: "success",
      data: {
        companyList,
      },
    });
  } catch (error) {
    console.error(
      `getCompanyByIndustryReq error:: ${(error as Error).message}`
    );
    throw error;
  }
});

router.get("/getAllCompanies", async (req: Request, res: Response) => {
  try {
    const companyList = await Company.find({});

    res.send({
      status: "success",
      data: {
        companyList,
      },
    });
  } catch (error) {
    console.error(`getAllCompaniesReq error:: ${(error as Error).message}`);
    throw error;
  }
});

export { router as CompanyRouter };
