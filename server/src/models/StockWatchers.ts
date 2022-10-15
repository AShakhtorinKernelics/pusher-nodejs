import mongoose from "mongoose";

interface StockWatchersAttrs {
  stockId: string;
  connectedTickerIdList: string[];
}

interface StockWatchersDoc extends mongoose.Document {
  stockId: string;
  connectedTickerIdList: string[];
}

interface StockWatchersModel extends mongoose.Model<StockWatchersDoc> {
  build(attrs: StockWatchersAttrs): StockWatchersDoc;
}

const stockWatchersSchema = new mongoose.Schema( // TODO stock id as key
  {
    stockId: {
      type: String,
      required: true,
    },
    connectedTickerIdList: {
      type: [String],
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

stockWatchersSchema.statics.build = (attrs: StockWatchersAttrs) => {
  return new StockWatchers(attrs);
};

const StockWatchers = mongoose.model<StockWatchersDoc, StockWatchersModel>(
  "StockWatchers",
  stockWatchersSchema
);

export { StockWatchers };
