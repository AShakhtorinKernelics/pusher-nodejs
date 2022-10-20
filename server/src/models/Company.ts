import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface CompanyAttrs {
  companySymbol: string;
  companyName: string;
  companyDescription: string;
  industry: string;
  tags: string[];
  address: string;
}

// "symbol", "industry", "companyName", description, tags, address

interface CompanyDoc extends mongoose.Document {
  companySymbol: string;
  companyName: string;
  companyDescription: string;
  industry: string;
  tags: string[];
  address: string;
}

interface CompanyModel extends mongoose.Model<CompanyDoc> {
  replaceAllWithNewValues(attrs: CompanyAttrs): Promise<{
    successCount: number;
    errorCount: number;
  }>;
}

const companySchema = new mongoose.Schema(
  {
    companySymbol: {
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
    industry: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      required: true,
    },
    address: {
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

companySchema.set("versionKey", "version");
companySchema.plugin(updateIfCurrentPlugin);

companySchema.statics.replaceAllWithNewValues = async (
  attrs: CompanyAttrs[]
) => {
  try {
    let successCount = 0;
    let errorCount = 0;

    await Promise.all(
      attrs.map(async (recentData) => {
        const companyObj = await Company.findOne({
          companySymbol: recentData.companySymbol,
        });
        if (companyObj) {
          try {
            await companyObj.replaceOne({
              ...recentData,
            });
            successCount++;
          } catch (err) {
            errorCount++;
            console.log(`err on replace ${recentData.companySymbol}`);
          }
        } else {
          try {
            const newEl = new Company({
              ...recentData,
            });
            await newEl.save();
            successCount++;
          } catch (err) {
            errorCount++;
            console.log(`err on create ${recentData.companySymbol}`);
          }
        }
      })
    );
    return Promise.resolve({
      successCount,
      errorCount,
    });
  } catch (err) {
    console.log("err on replace All with New");
    throw err;
  }
};

const Company = mongoose.model<CompanyDoc, CompanyModel>(
  "Company",
  companySchema
);

export { Company };
