import express, { Response, Request } from "express";
import { Company } from "../models/Company";
import axios from "axios";

const router = express.Router();

router.post("/updateCompanyInfoInDb", async (req: Request, res: Response) => {
  try {
    //   const { listOfTickers, listOfFilters }: { listOfTickers: string[], listOfFilters: string[] } = req.body;

    const listOfTickers = ["AAPL", "FB", "TSLA"];
    const listOfFilters = [
      "symbol",
      "industry",
      "companyName",
      "description",
      "tags",
      "address",
    ];

    const stockList = listOfTickers.join(",");
    const token = "sk_d49e4fe09bd64537913bf4f1c00adc2d";
    const dataFilters = listOfFilters.join(",");
    const updatedData = await axios.get(
      `https://cloud.iexapis.com/v1/stock/market/company?symbols=${stockList}&filter=${dataFilters}&token=${token}`
    );

    console.log(updatedData);

    const companyDataToInsert = updatedData.data.map(
      (companyData: any, index: number) => {
        return {
          companySymbol: listOfTickers[index],
          companyName: companyData.companyName.trim(),
          companyDescription: companyData.description.trim(),
          industry: companyData.industry.trim(),
          tags: companyData.tags,
          address: companyData.address.trim(),
        };
      }
    );

    const { insertedCompanies, successCount, errorCount } =
      await Company.replaceAllWithNewValues(companyDataToInsert);

    console.log(`successCount: ${successCount}`);
    console.log(`errorCount: ${errorCount}`);

    res.send({
      status: "success",
      data: {
        insertedCompanies,
      },
    });
  } catch (error) {
    console.error(
      `updateCompanyInfoInDbReq error:: ${(error as Error).message}`
    );
    throw error;
  }
});

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

export { router as companyRouter };
