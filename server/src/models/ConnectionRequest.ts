import mongoose from "mongoose";

interface ConnectionRequestAttrs {
  userId: string;
  requesters: { userId: string; userName: string }[];
}

interface ConnectionRequestDoc extends mongoose.Document {
  userId: string;
  requesters: { userId: string; userName: string }[];
}

interface ConnectionRequestModel extends mongoose.Model<ConnectionRequestDoc> {
  build(attrs: ConnectionRequestAttrs): ConnectionRequestDoc;
}

const connectionRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    requesters: {
      type: [{ userId: String, userName: String }],
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

connectionRequestSchema.statics.build = (attrs: ConnectionRequestAttrs) => {
  return new ConnectionRequest(attrs);
};

const ConnectionRequest = mongoose.model<
  ConnectionRequestDoc,
  ConnectionRequestModel
>("ConnectionRequest", connectionRequestSchema);

export { ConnectionRequest };
