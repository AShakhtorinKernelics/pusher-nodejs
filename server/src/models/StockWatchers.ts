import mongoose from "mongoose";

interface StockWatchersAttrs {
  stockSymbol: string;
  connectedUserIdList: string[];
}

interface StockWatchersDoc extends mongoose.Document {
  stockSymbol: string;
  connectedUserIdList: string[];
}

interface StockWatchersModel extends mongoose.Model<StockWatchersDoc> {
  build(attrs: StockWatchersAttrs): StockWatchersDoc;
}

const stockWatchersSchema = new mongoose.Schema(
  {
    stockSymbol: {
      type: String,
      required: true,
    },
    connectedUserIdList: {
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
