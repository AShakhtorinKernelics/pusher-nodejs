import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface TickerInfoAttrs {
  tickerId: string;
  tickerName: string;
  tickerDescription: string;
  stockPrice: number;
  pricePerEarning: number;
  fiveDayReturn: number;
  dividentYeel: string;
}

interface TickerInfoDoc extends mongoose.Document {
  tickerId: string;
  tickerName: string;
  tickerDescription: string;
  stockPrice: number;
  pricePerEarning: number;
  fiveDayReturn: number;
  dividentYeel: string;
  version: number;
}

interface TickerInfoModel extends mongoose.Model<TickerInfoDoc> {
  build(attrs: TickerInfoAttrs): TickerInfoDoc;
}

const tickerInfoSchema = new mongoose.Schema(
  {
    tickerId: {
      type: String,
      required: true,
    },
    tickerName: {
      type: String,
      required: true,
    },
    tickerDescription: {
      type: String,
      required: true,
    },
    stockPrice: {
      type: Number,
      required: true,
    },
    pricePerEarning: {
      type: Number,
      required: true,
    },
    fiveDayReturn: {
      type: Number,
      required: true,
    },
    dividentYeel: {
      type: String,
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
