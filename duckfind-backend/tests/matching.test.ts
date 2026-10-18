import { describe, expect, it } from "vitest";
import { levelsFromEducation, scoreJob, type MatchProfile } from "../src/lib/matching.js";
import { findSkillsIn } from "../src/lib/skills.js";

describe("findSkillsIn", () => {
  it("finds plain skills, including ones with symbols", () => {
    expect(findSkillsIn("Experience with C++, C#, Node.js and react")).toEqual([
      "C++",
      "C#",
      "React",
      "Node.js",
    ]);
  });

  it("doesn't mistake everyday words for skills", () => {
    const text = `Spring 2027 Software Engineering Intern
Go above and beyond for customers. Express interest by applying.
We raised our Series C last year. Swift responses matter here.`;
    expect(findSkillsIn(text)).toEqual([]);
  });

  it("still finds those skills when they mean the technology", () => {
    expect(findSkillsIn("Our services are written in Go and Rust, with Spring Boot.")).toEqual([
      "Go",
      "Rust",
      "Spring",
    ]);
    expect(findSkillsIn("Skills:\n• C\n• Swift\nExpress.js APIs, golang")).toEqual([
      "C",
      "Go",
      "Swift",
      "Express",
    ]);
  });
});

describe("levelsFromEducation", () => {
  const now = new Date("2026-10-18");

  it("knows nothing without education", () => {
    expect(levelsFromEducation([], now)).toEqual([]);
  });

  it("points students at internships and graduate roles", () => {
    expect(
      levelsFromEducation([{ status: "expected", graduationDate: "2027-06-30" }], now),
    ).toEqual(["intern", "graduate"]);
  });

  it("points recent and older graduates at different levels", () => {
    expect(
      levelsFromEducation([{ status: "graduated", graduationDate: "2025-07-01" }], now),
    ).toEqual(["graduate", "junior"]);
    expect(
      levelsFromEducation([{ status: "graduated", graduationDate: "2019-07-01" }], now),
    ).toEqual(["junior", "mid"]);
  });
});

describe("scoreJob", () => {
  const student: MatchProfile = {
    skills: ["Python", "React", "SQL"],
    words: ["frontend"],
    levels: ["intern", "graduate"],
  };

  it("ranks a job asking for the user's skills at their level above one that doesn't", () => {
    const good = scoreJob(
      {
        title: "Frontend Engineering Intern",
        descriptionText: "You'll build React apps backed by Python and SQL.",
        seniority: "intern",
        score: 5,
      },
      student,
      5,
    );
    const weak = scoreJob(
      {
        title: "Platform Engineer",
        descriptionText: "Kubernetes, Docker, AWS, Linux and a little Python.",
        seniority: "mid",
        score: 1,
      },
      student,
      5,
    );

    expect(good).toMatchObject({
      matched: ["Python", "React", "SQL"],
      missing: [],
      levelFit: true,
    });
    expect(weak).toMatchObject({
      matched: ["Python"],
      missing: ["Docker", "Kubernetes", "AWS", "Linux"],
    });
    // Everything but a 4th shared skill
    expect(good!.score).toBe(96);
    expect(good!.score).toBeGreaterThan(weak!.score);
  });

  it("pushes senior roles down for students", () => {
    const job = {
      title: "Senior React Engineer",
      descriptionText: "React and SQL",
      seniority: "senior",
    };
    expect(scoreJob(job, student, 1)!.score).toBeLessThan(
      scoreJob({ ...job, seniority: "graduate" }, student, 1)!.score,
    );
  });

  it("drops jobs with no shared skill and nothing in the title", () => {
    expect(
      scoreJob(
        { title: "Account Executive", descriptionText: "Sell our data platform" },
        student,
        1,
      ),
    ).toBeNull();
  });
});
