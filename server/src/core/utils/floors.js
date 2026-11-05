/**
 * Natural order for floors on the floor plan: Basement, Ground, First, Second… then anything else
 * alphabetically. Within a floor: sortOrder, then name.
 */
const WORDS = [
  "ground",
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
];

export function floorRank(floor = "") {
  const f = floor.toLowerCase();
  if (/basement|lower ground|cellar/.test(f)) return -1;
  const word = WORDS.findIndex((w) => f.includes(w));
  if (word >= 0) return word;
  const n = f.match(/\d+/);
  return n ? Number(n[0]) : 100;
}

export const compareChairs = (a, b) =>
  floorRank(a.floor) - floorRank(b.floor) ||
  a.floor.localeCompare(b.floor) ||
  a.sortOrder - b.sortOrder ||
  a.name.localeCompare(b.name, undefined, { numeric: true });
