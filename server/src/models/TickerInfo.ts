import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface TickerInfoAttrs {
  tickerSymbol: string;
  companyName: string;
  peRatio: string;
  day5ChangePercent: string;
  dividendYield: string;
}

/*  "companyName",
      "peRatio",
      "day5ChangePercent",
      "dividendYield", */

interface TickerInfoDoc extends mongoose.Document {
  tickerSymbol: string;
  companyName: string;
  peRatio: string;
  day5ChangePercent: string;
  dividendYield: string;
}

interface TickerInfoModel extends mongoose.Model<TickerInfoDoc> {
  build(attrs: TickerInfoAttrs): TickerInfoDoc;
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

tickerInfoSchema.statics.build = (attrs: TickerInfoAttrs) => {
  return new TickerInfo(attrs);
};

const TickerInfo = mongoose.model<TickerInfoDoc, TickerInfoModel>(
  "TickerInfo",
  tickerInfoSchema
);

export { TickerInfo };
