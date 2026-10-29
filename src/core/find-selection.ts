/** Exact selected text, bounded by code points rather than UTF-16 units. */
export function eligibleFindSeed(text: string): string | undefined {
  if (!text || /[\r\n\u2028\u2029]/u.test(text)) return;
  let count = 0;
  for (const _point of text) if (++count > 256) return;
  return text;
}
