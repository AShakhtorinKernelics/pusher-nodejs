import mongoose from "mongoose";
import { ConnectionEnum } from "../routes";

interface ConnectionAttrs {
  connectionId: string;
  connectionName: string;
  connectionType: ConnectionEnum;
  participants: string[];
  participantsCanWrite: boolean;
  ownerId: string;
  imageUrl: string;
}

interface ConnectionDoc extends mongoose.Document {
  connectionId: string;
  connectionName: string;
  connectionType: ConnectionEnum;
  participants: string[];
  participantsCanWrite: boolean;
  ownerId: string;
  imageUrl: string;
}

interface ConnectionModel extends mongoose.Model<ConnectionDoc> {
  build(attrs: ConnectionAttrs): ConnectionDoc;
}

const connectionSchema = new mongoose.Schema(
  {
    connectionId: {
      type: String,
      required: true,
    },
    connectionName: {
      type: String,
      required: true,
    },
    connectionType: {
      type: String,
      require: true,
      // enum: Object.values(ConnectionEnum),
    },
    participants: {
      type: [String],
      require: true,
    },
    ownerId: {
      type: String,
    },
    participantsCanWrite: {
      type: Boolean,
      require: true,
    },
    imageUrl: {
      type: String,
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

connectionSchema.statics.build = (attrs: ConnectionAttrs) => {
  return new Connection(attrs);
};

const Connection = mongoose.model<ConnectionDoc, ConnectionModel>(
  "Connection",
  connectionSchema
);

export { Connection };
