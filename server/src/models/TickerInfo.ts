import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface TickerInfoAttrs {
  tickerSymbol: string;
  companyName: string;
  peRatio: string;
  day5ChangePercent: string;
  dividendYield: string;
}

interface TickerInfoDoc extends mongoose.Document {
  tickerSymbol: string;
  companyName: string;
  peRatio: string;
  day5ChangePercent: string;
  dividendYield: string;
}

interface TickerInfoModel extends mongoose.Model<TickerInfoDoc> {
  replaceAllWithNewValues(attrs: TickerInfoAttrs): Promise<{
    successCount: number;
    errorCount: number;
    tickerInfoList: TickerInfoDoc;
  }>;
}

const tickerInfoSchema = new mongoose.Schema(
  {
    tickerSymbol: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    peRatio: {
      type: String,
      required: true,
    },
    day5ChangePercent: {
      type: String,
      required: true,
    },
    dividendYield: {
      type: Number,
      required: true,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

tickerInfoSchema.set("versionKey", "version");
tickerInfoSchema.plugin(updateIfCurrentPlugin);

/* tickerInfoSchema.statics.build = (attrs: TickerInfoAttrs) => {
  return new TickerInfo(attrs);
}; */

tickerInfoSchema.statics.replaceAllWithNewValues = async (
  attrs: TickerInfoAttrs[]
) => {
  try {
    let successCount = 0;
    let errorCount = 0;
    const tickerInfoList: TickerInfoDoc[] = [];
    await Promise.all(
      attrs.map(async (recentData) => {
        const tickerInfoObj = await TickerInfo.findOne({
          tickerSymbol: recentData.tickerSymbol,
        });
        if (tickerInfoObj) {
          try {
            await tickerInfoObj.replaceOne({
              ...recentData,
            });
            tickerInfoList.push(tickerInfoObj);
            successCount++;
          } catch (err) {
            errorCount++;
            console.log(`err on replace ${recentData.tickerSymbol}`);
          }
        } else {
          try {
            const newEl = new TickerInfo({
              ...recentData,
            });
            await newEl.save();
            tickerInfoList.push(newEl);
            successCount++;
          } catch (err) {
            errorCount++;
            console.log(`err on create ${recentData.tickerSymbol}`);
          }
        }
      })
    );
    return Promise.resolve({
      tickerInfoList,
      successCount,
      errorCount,
    });
  } catch (err) {
    console.log("err on replace All with New");
    throw err;
  }
};

const TickerInfo = mongoose.model<TickerInfoDoc, TickerInfoModel>(
  "TickerInfo",
  tickerInfoSchema
);

export { TickerInfo };
