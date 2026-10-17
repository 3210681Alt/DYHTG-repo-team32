import { model, Schema, type InferSchemaType } from "mongoose";

// MongoDB collection written by the Python scraper (scraper/models/job.py); read-only here.
// The scraper creates the indexes, so autoIndex is off.
const jobSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    greenhouseId: { type: Number, required: true },
    title: { type: String, required: true },
    location: String,
    isUk: Boolean,
    url: String,
    descriptionHtml: String,
    descriptionText: String,
    departments: [String],
    offices: [String],
    // Derived by the scraper from title/location (scraper/classify.py)
    countries: [String],
    workplace: [String],
    seniority: String,
    firstPublishedAt: Date,
    // When Greenhouse last updated the listing
    updatedAt: Date,
    sponsorsVisa: Boolean,
    lastSeenAt: Date,
  },
  { collection: "jobs", autoIndex: false },
);

export type Job = InferSchemaType<typeof jobSchema>;

export const JobModel = model("Job", jobSchema);
