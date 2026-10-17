// The skills users can pick from. Edit freely: the DB stores plain text, so no migration is needed.
export const SKILLS = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C",
  "C++",
  "C#",
  "Go",
  "Rust",
  "Kotlin",
  "Swift",
  "PHP",
  "HTML",
  "CSS",
  "React",
  "Angular",
  "Vue",
  "Next.js",
  "Node.js",
  "Express",
  "Django",
  "Flask",
  "Spring",
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "Git",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "Google Cloud",
  "Linux",
  "Machine Learning",
  "Data Science",
  "UI/UX Design",
  "Figma",
] as const;

const skillsByLowercase = new Map<string, string>(
  SKILLS.map((skill) => [skill.toLowerCase(), skill]),
);

// Case-insensitive lookup; returns the canonical spelling, or undefined if it isn't in the list
export const findSkill = (input: string): string | undefined =>
  skillsByLowercase.get(input.trim().toLowerCase());
