interface JsonToken { start: number; end: number; text: string }

/** Walk valid JSON without materializing a token cache. Whitespace inserted by
 * pretty printing is not a source token. The caller already owns parsed JSON.
 */
function* tokens(text: string): Generator<JsonToken> {
  for (let start = 0; start < text.length;) {
    if (/\s/.test(text[start])) { start++; continue; }
    let end = start + 1;
    if (text[start] === '"') {
      while (end < text.length) {
        if (text[end] === '\\') end += 2;
        else if (text[end++] === '"') break;
      }
    } else if (!'{}[]:,'.includes(text[start])) {
      while (end < text.length && !/[\s{}\[\]:,]/.test(text[end])) end++;
    }
    yield { start, end, text: text.slice(start, end) };
    start = end;
  }
}

/** Verify selected text against the corresponding original token region or an
 * explicitly equal active message. No decoded offset is projected into JSON:
 * seeding supplies text, not a highlight range. Generated whitespace without an
 * original counterpart and reordered/removed keys cannot establish provenance.
 */
export function fieldsSelectionHasSource(application: string, pretty: string, start: number, end: number, message?: string): boolean {
  const original = tokens(application);
  const selected = pretty.slice(start, end);
  let previousEnd = 0, regionStart: number | undefined;
  for (const shown of tokens(pretty)) {
    const received = original.next().value;
    if (!received) return false;
    let decoded: unknown;
    if (shown.text !== received.text) {
      try { decoded = JSON.parse(shown.text); if (!Object.is(decoded, JSON.parse(received.text))) return false; }
      catch { return false; }
    }
    if (regionStart === undefined && shown.end > start) regionStart = shown.start <= start ? received.start : previousEnd;
    if (shown.end >= end && regionStart !== undefined) {
      const regionEnd = shown.start >= end ? received.start : received.end;
      if (application.slice(regionStart, regionEnd).includes(selected)) return true;
      return shown.start <= start && shown.end >= end && message !== undefined && decoded === message && message.includes(selected);
    }
    previousEnd = received.end;
  }
  return false;
}
