import { model, Schema, type InferSchemaType } from "mongoose";

// MongoDB collection written by the Python scraper (scraper/models/company.py); read-only here.
// The scraper creates the indexes, so autoIndex is off.
const companySchema = new Schema(
  {
    boardToken: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    boardUrl: String,
    jobCount: Number,
    sponsorsVisa: { type: Boolean, default: false },
    sponsorRegisterName: String,
    sponsorRoutes: [String],
    lastScrapedAt: Date,
    createdAt: Date,
    updatedAt: Date,
  },
  { collection: "companies", autoIndex: false },
);

export type Company = InferSchemaType<typeof companySchema>;

export const CompanyModel = model("Company", companySchema);
