import type { Format } from "../lib/types";

/** Event prefixes chains put on titles; they become attributes instead. */
const EVENT_PREFIXES: [pattern: RegExp, attribute: string][] = [
  [/^open caption\s*:\s*/i, "Open Caption"],
  [/^sing-?along\s*:\s*/i, "Sing-Along"],
  [/^quote-?along\s*:\s*/i, "Quote-Along"],
  [/^early access\s*:\s*/i, "Early Access"],
  [/^fan event\s*:\s*/i, "Fan Event"],
];

const SMALL_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "but",
  "by",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "vs",
  "vs.",
]);
const ROMAN = /^(?:i{1,3}|iv|v|vi{1,3}|ix|x)$/i;

function titleCaseWord(word: string, first: boolean): string {
  const lower = word.toLowerCase();
  if (!first && SMALL_WORDS.has(lower)) return lower;
  if (ROMAN.test(word) && word.length > 1) return word.toUpperCase();
  return lower.replace(
    /(^|[-'’(“"])([a-z])/g,
    (_, edge: string, ch: string) => edge + ch.toUpperCase(),
  );
}

/** "AVENGERS ENDGAME: ENCORE" -> "Avengers Endgame: Encore". Mixed-case titles are left alone. */
export function titleCase(title: string): string {
  if (/[a-z]/.test(title)) return title;
  let afterColon = true;
  return title
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part)) return part;
      const out = titleCaseWord(part, afterColon);
      afterColon = part.endsWith(":");
      return out;
    })
    .join("");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type CleanTitle = {
  title: string;
  /** Year from a trailing "(2006)", if the title had one. */
  year: number | null;
  /** Event prefixes pulled off the title, e.g. "Open Caption". */
  attributes: string[];
};

export function cleanTitle(raw: string): CleanTitle {
  let title = raw.trim().replace(/\s+/g, " ");
  const attributes: string[] = [];

  for (let stripped = true; stripped;) {
    stripped = false;
    for (const [pattern, attribute] of EVENT_PREFIXES) {
      if (pattern.test(title)) {
        title = title.replace(pattern, "");
        attributes.push(attribute);
        stripped = true;
      }
    }
  }

  let year: number | null = null;
  const yearMatch = title.match(/\s*\((\d{4})\)\s*$/);
  if (yearMatch) {
    year = Number(yearMatch[1]);
    title = title.slice(0, yearMatch.index).trim();
  }

  return { title: titleCase(title), year, attributes };
}

/** A stable movie ID. The year disambiguates remakes ("Dune" 1984 vs 2021). */
export function movieId(title: string, year: number | null): string {
  const slug = slugify(title);
  return year ? `${slug}-${year}` : slug;
}

export function normalizeRating(raw: string | null | undefined): string | null {
  const value = raw?.trim().toUpperCase().replace(/\s+/g, "");
  if (!value) return null;
  if (value === "PG13") return "PG-13";
  if (value === "NC17") return "NC-17";
  if (value === "NOTRATED" || value === "UNRATED") return "NR";
  return value;
}

/** Picks the canonical format from whatever tags a chain gives us. */
export function detectFormat(tags: (string | null | undefined)[]): Format {
  const text = tags.filter(Boolean).join(" ").toLowerCase();
  if (/\b70\s?mm\b/.test(text)) return "70mm";
  if (/\b35\s?mm\b/.test(text)) return "35mm";
  if (/imax/.test(text)) return "imax";
  // "Dolby Atmos" is just a sound system on ordinary screens; only Dolby Cinema is the premium format.
  if (/dolby\s+cinema/.test(text)) return "dolby";
  if (/\brpx\b/.test(text)) return "rpx";
  if (/\b3d\b/.test(text)) return "3d";
  return "standard";
}
