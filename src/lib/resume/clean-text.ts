const MAX_CHARACTERS = 100_000;

export function cleanText(input: string) {
  return input
    .replace(/\0/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_CHARACTERS);
}
