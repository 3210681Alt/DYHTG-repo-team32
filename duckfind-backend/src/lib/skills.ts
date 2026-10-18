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

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "C++" or "Node.js" need their own word boundaries, so \b on its own won't do
const plainPattern = (skill: string) =>
  new RegExp(`(^|[^a-z0-9+#.])${escapeRegex(skill)}(?=$|[^a-z0-9+#])`, "i");

// Some skills are also everyday words ("go", "swift", "express") or show up in internship titles
// ("Spring 2027 Intern"). These only count when capitalised mid-sentence ("We use Go and Rust"),
// on their own in a list ("• Go"), or written in a way that can only mean the technology.
function capitalisedWord(word: string, notBefore = "") {
  const midSentence = new RegExp(`(?<!(?:^|[.!?:•*])\\s*)\\b${word}\\b(?![-'’]${notBefore})`, "m");
  const listed = new RegExp(`(?:^|[•*])\\s*${word}\\s*(?:[,/(]|$)`, "m");
  return [midSentence, listed];
}

const TRICKY_SKILLS: Partial<Record<(typeof SKILLS)[number], RegExp[]>> = {
  // Not "Series C", "Grade C", "C-suite", "C++" or "C#"
  C: [
    /(?<![A-Za-z0-9+#.-]|Series |Class |Grade |Level |Tier |Type |Plan |Part |Section |Vitamin )C(?![A-Za-z0-9+#-]|\.\w)/,
  ],
  Go: [/\bgolang\b/i, ...capitalisedWord("Go")],
  Rust: capitalisedWord("Rust"),
  Swift: [/\bswiftui\b/i, ...capitalisedWord("Swift")],
  Express: [/\bexpress\.?js\b/i, ...capitalisedWord("Express", "| Entry| interest")],
  Spring: [
    /\bspring\s+(boot|framework|mvc|cloud|data|security)\b/i,
    ...capitalisedWord(
      "Spring",
      "|\\s+(20\\d\\d|term|week|internship|intern|insight|semester|cohort|programme|program|placement|start|intake|break)",
    ),
  ],
};

const skillMatchers = SKILLS.map((skill) => ({
  skill,
  patterns: TRICKY_SKILLS[skill] ?? [plainPattern(skill)],
}));

// The skills from the list that a piece of text mentions, e.g. a CV or a job description.
// Pass the text with its original capitals: some skills depend on them.
export const findSkillsIn = (text: string): string[] =>
  skillMatchers
    .filter(({ patterns }) => patterns.some((pattern) => pattern.test(text)))
    .map(({ skill }) => skill);
