import mongoose from "mongoose";
import { ConnectionEnum } from "../routes";

interface msgPayloadInterface {
  senderId: string;
  senderName: string;
  text: string;
  type: ConnectionEnum;
}

interface archivedMsg {
  msgPayload: msgPayloadInterface;
}

interface ArchivedConnectionDataAttrs {
  connectionId: string;
  connectionMessages: archivedMsg[];
}

interface ArchivedConnectionDataDoc extends mongoose.Document {
  connectionId: string;
  connectionMessages: archivedMsg[];
}

interface ArchivedConnectionDataModel
  extends mongoose.Model<ArchivedConnectionDataDoc> {
  build(attrs: ArchivedConnectionDataAttrs): ArchivedConnectionDataDoc;
}

const msgPayloadSchema = new mongoose.Schema({
  senderId: {
    type: String,
    require: true,
  },
  senderName: {
    type: String,
    require: true,
  },
  text: {
    type: String,
    require: true,
  },
  type: {
    type: String,
    require: true,
    // enum: Object.values(ConnectionEnum),
  },
});

const archivedMsgSchems = new mongoose.Schema({
  msgPayload: {
    type: msgPayloadSchema,
    require: true,
  },
});

const archivedConnectionDataSchema = new mongoose.Schema(
  {
    connectionId: {
      type: String,
      required: true,
    },
    connectionMessages: {
      type: [archivedMsgSchems],
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

archivedConnectionDataSchema.statics.build = (
  attrs: ArchivedConnectionDataAttrs
) => {
  return new ArchivedConnectionData(attrs);
};

const ArchivedConnectionData = mongoose.model<
  ArchivedConnectionDataDoc,
  ArchivedConnectionDataModel
>("ArchivedConnectionData", archivedConnectionDataSchema);

export { ArchivedConnectionData };
