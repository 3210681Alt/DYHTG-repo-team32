import { env } from "./env.js";
// greenhouse
type GreenhouseJobSummary = {
  id: number;
};

type GreenhouseJobsResponse = {
  jobs: GreenhouseJobSummary[];
  meta: {
    total: number;
  };
};

const greenhouseBaseUrl =
  `${env.GREENHOUSE_API_BASE_URL}/boards/${env.GREENHOUSE_BOARD_TOKEN}`;

export async function fetchAllGreenhouseJobs() {
  const listResponse = await fetch(`${greenhouseBaseUrl}/jobs?content=true`);

  if (!listResponse.ok) {
    throw new Error(
      `Greenhouse jobs request failed with status ${listResponse.status}`,
    );
  }

  const listData = (await listResponse.json()) as GreenhouseJobsResponse;

  const detailedJobs = await Promise.all(
    listData.jobs.map(async ({ id }) => {
      const jobResponse = await fetch(
        `${greenhouseBaseUrl}/jobs/${id}?questions=true`,
      );

      if (!jobResponse.ok) {
        throw new Error(
          `Greenhouse job ${id} request failed with status ${jobResponse.status}`,
        );
      }

      return jobResponse.json();
    }),
  );

  return detailedJobs;
}