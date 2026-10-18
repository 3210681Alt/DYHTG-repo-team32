import { extractText, getDocumentProxy } from "unpdf";
import { findSkillsIn } from "./skills.js";

// Turns a CV into search keywords for finding matching jobs:
// skills from DuckFind's list that appear in it, then the words it uses most.

const MAX_KEYWORDS = 25;
const MAX_FREQUENT_WORDS = 12;

// Common words, plus words every CV has, which say nothing about the jobs someone wants
const IGNORED_WORDS = new Set(
  `about above after again against also although among another anything around because been before
being below between both could didn during each either else every from further have having here
into itself just more most much must never only other ours ourselves over same should since some
such than that their theirs them themselves then there these they this those through under until
very were what when where which while whom whose will with within without would your yours
year years month months january february march april june july august september october november
december present current currently email phone mobile address linkedin github http https www
curriculum vitae resume profile personal summary references available request education
experience skills skill interests hobbies project projects work worked working university
college school degree grade grades achieved including various responsible role roles team
teams using used help helped well good great strong excellent able ability`.split(/\s+/),
);

export async function pdfToText(file: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(file));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

export function keywordsFromText(text: string): string[] {
  // Email addresses and links would add words like the user's name or "gmail"
  const cleaned = text.replace(/\S+@\S+|\S*(https?:\/\/|www\.|\.com|\.io)\S*/gi, " ");
  const lower = cleaned.toLowerCase();
  const skills = findSkillsIn(cleaned);

  // Count the remaining words (letters only, at least 4 long) and keep the ones used most
  const counts = new Map<string, number>();
  for (const word of lower.match(/[a-z][a-z-]{3,}/g) ?? []) {
    if (IGNORED_WORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  // Words of skills already found ("machine" and "learning" for "Machine Learning")
  const skillWords = new Set(skills.flatMap((skill) => skill.toLowerCase().split(/\s+/)));
  const frequent = [...counts.entries()]
    .filter(([word, count]) => count >= 2 && !skillWords.has(word))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_FREQUENT_WORDS)
    .map(([word]) => word);

  return [...skills, ...frequent].slice(0, MAX_KEYWORDS);
}
