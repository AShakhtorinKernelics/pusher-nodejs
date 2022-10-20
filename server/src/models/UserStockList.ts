import mongoose from "mongoose";

interface UserStockListAttrs {
  userId: string;
  stockSymbolList: string[];
}

interface UserStockListDoc extends mongoose.Document {
  userId: string;
  stockSymbolList: string[];
}

interface UserStockListModel extends mongoose.Model<UserStockListDoc> {
  build(attrs: UserStockListAttrs): UserStockListDoc;
}

const userStockListSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    stockSymbolList: {
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

userStockListSchema.statics.build = (attrs: UserStockListAttrs) => {
  return new UserStockList(attrs);
};

const UserStockList = mongoose.model<UserStockListDoc, UserStockListModel>(
  "UserStockList",
  userStockListSchema
);

export { UserStockList };
