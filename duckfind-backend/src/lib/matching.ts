import type { UserUniversity } from "../models/user.model.js";
import { findSkillsIn } from "./skills.js";

// Scores how well a job fits a user, out of 100, for My matches.
//
//   skill fit   45  share of the skills the job asks for that the user has
//   breadth     15  how many of the user's skills it uses (up to 4)
//   title       15  the job title names one of their skills or a word their CV keeps using
//   level       15  the job is at the level their education points to (minus 30 if far above it)
//   text        10  MongoDB's text score, so jobs that mention them a lot still rise

export type MatchProfile = {
  skills: string[];
  // Other words the CV uses a lot, e.g. "backend", "marketing", "analyst"
  words: string[];
  // Seniority levels that fit the user; empty when we don't know
  levels: string[];
};

export type MatchableJob = {
  title: string;
  descriptionText?: string | null;
  seniority?: string | null;
  score?: number;
};

export type Match = {
  score: number;
  // Skills the job asks for that the user has, and ones they don't
  matched: string[];
  missing: string[];
  levelFit: boolean;
};

const TOO_SENIOR = new Set(["senior", "lead"]);

export function levelsFromEducation(
  universities: Pick<UserUniversity, "status" | "graduationDate">[],
  now = new Date(),
) {
  if (!universities.length) return [];
  if (universities.some((uni) => uni.status !== "graduated")) return ["intern", "graduate"];

  // Graduated: recent graduates fit graduate schemes, others junior and mid-level roles
  const twoYearsAgo = new Date(now);
  twoYearsAgo.setFullYear(now.getFullYear() - 2);
  const recent = universities.some(
    (uni) => !uni.graduationDate || new Date(uni.graduationDate) >= twoYearsAgo,
  );
  return recent ? ["graduate", "junior"] : ["junior", "mid"];
}

const containsWord = (text: string, word: string) =>
  new RegExp(
    `(^|[^a-z0-9])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[^a-z0-9])`,
    "i",
  ).test(text);

// Null when the job has nothing to do with the user (no shared skill and nothing in the title),
// unless the user has no listed skills at all, where the text search is all there is to go on
export function scoreJob(
  job: MatchableJob,
  profile: MatchProfile,
  bestTextScore: number,
): Match | null {
  const jobSkills = findSkillsIn(`${job.title}\n${job.descriptionText ?? ""}`);
  const mine = new Set(profile.skills);
  const matched = jobSkills.filter((skill) => mine.has(skill));
  const missing = jobSkills.filter((skill) => !mine.has(skill));
  const titleHit = [...profile.skills, ...profile.words].some((word) =>
    containsWord(job.title, word),
  );

  if (!matched.length && !titleHit && profile.skills.length) return null;

  // Divide by at least 3, so a job that lists one skill isn't a "perfect" match for it
  const skillFit = matched.length / Math.max(jobSkills.length, 3);
  const breadth = Math.min(matched.length, 4) / 4;
  const text = bestTextScore > 0 ? (job.score ?? 0) / bestTextScore : 0;

  const levelFit = Boolean(job.seniority && profile.levels.includes(job.seniority));
  let level = levelFit ? 15 : 0;
  if (profile.levels.length && job.seniority && TOO_SENIOR.has(job.seniority)) level = -30;

  const score = 45 * skillFit + 15 * breadth + (titleHit ? 15 : 0) + level + 10 * text;
  return {
    score: Math.round(Math.min(100, Math.max(0, score))),
    matched,
    missing,
    levelFit,
  };
}
