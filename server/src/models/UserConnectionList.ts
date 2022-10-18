import mongoose from "mongoose";
import { ConnectionEnum } from "../routes";

interface UserConnectionListAttrs {
  userId: string;
  connectionList: any[];
}

interface UserConnectionListDoc extends mongoose.Document {
  userId: string;
  connectionList: any[];
}

interface UserConnectionListModel
  extends mongoose.Model<UserConnectionListDoc> {
  build(attrs: UserConnectionListAttrs): UserConnectionListDoc;
}

const userConnectionListSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    connectionList: {
      type: [],
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

userConnectionListSchema.statics.build = (attrs: UserConnectionListAttrs) => {
  return new UserConnectionList(attrs);
};

const UserConnectionList = mongoose.model<
  UserConnectionListDoc,
  UserConnectionListModel
>("UserConnectionList", userConnectionListSchema);

export { UserConnectionList };
