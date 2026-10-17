import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectMongo() {
  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB,
    serverSelectionTimeoutMS: 5000,
  });
}
