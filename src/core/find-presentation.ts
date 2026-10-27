/** Complete, consecutive original-source slices. Fragments add no separators. */
export function sourceFragments(text: string): { start: number; text: string }[] {
  const fragments: { start: number; text: string }[] = [];
  for (let start = 0; start < text.length;) {
    let end = Math.min(start + 8192, text.length);
    if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1]) && /[\uDC00-\uDFFF]/.test(text[end])) end--;
    fragments.push({ start, text: text.slice(start, end) });
    start = end;
  }
  return fragments;
}
