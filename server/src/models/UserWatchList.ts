import mongoose from "mongoose";

interface WatchlistStock {
  tickerSymbol: string;
  companyName: string;
  dividendYield: string;
}

interface UserWatchListAttrs {
  userId: string;
  stockSymbolList: WatchlistStock[];
}

interface UserWatchListDoc extends mongoose.Document {
  userId: string;
  stockSymbolList: WatchlistStock[];
}

interface UserWatchListModel extends mongoose.Model<UserWatchListDoc> {
  build(attrs: UserWatchListAttrs): UserWatchListDoc;
}

const userWatchListSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    stockSymbolList: {
      type: [
        {
          tickerSymbol: String,
          companyName: String,
          dividendYield: String,
        },
      ],
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

userWatchListSchema.statics.build = (attrs: UserWatchListAttrs) => {
  return new UserWatchList(attrs);
};

const UserWatchList = mongoose.model<UserWatchListDoc, UserWatchListModel>(
  "UserWatchList",
  userWatchListSchema
);

export { UserWatchList };
