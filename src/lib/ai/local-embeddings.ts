const DIMENSIONS = 128;

export function localEmbedding(text: string) {
  const vector = Array<number>(DIMENSIONS).fill(0);
  for (const token of text.toLowerCase().match(/[a-z0-9+#.]{2,}/g) ?? []) {
    let hash = 2166136261;
    for (let index = 0; index < token.length; index += 1) {
      hash ^= token.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    vector[(hash >>> 0) % DIMENSIONS] += 1;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value ** 2, 0));
  return magnitude ? vector.map((value) => value / magnitude) : vector;
}
