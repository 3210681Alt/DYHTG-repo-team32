import type { Request, Response } from "express";
import { fetchAllGreenhouseJobs } from "../lib/greenhouse.js";

export async function getGreenhouseJobs(_req: Request, res: Response) {
  const jobs = await fetchAllGreenhouseJobs();

  res.status(200).json({
    status: 200,
    jobs,
  });
}