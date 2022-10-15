import mongoose from "mongoose";

interface CompanyAttrs {
  companyId: string;
  companyName: string;
  companyDescription: string;
  connectedTickerIdList: string[];
}

interface CompanyDoc extends mongoose.Document {
  companyId: string;
  companyName: string;
  companyDescription: string;
  connectedTickerIdList: string[];
}

interface CompanyModel extends mongoose.Model<CompanyDoc> {
  build(attrs: CompanyAttrs): CompanyDoc;
}

const companySchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    companyDescription: {
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

companySchema.statics.build = (attrs: CompanyAttrs) => {
  return new Company(attrs);
};

const Company = mongoose.model<CompanyDoc, CompanyModel>(
  "Company",
  companySchema
);

export { Company };
