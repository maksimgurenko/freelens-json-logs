import { FIND_QUERY_LIMIT, sameFindKey, type FindKey, type FindQuery } from './find-protocol.ts';

interface HistoryEvaluation { phase: string; key?: FindKey; records: readonly unknown[]; composing: boolean }

/** Action-time commitment only: completion never schedules a history write. */
export class FindHistory {
  entries: readonly FindQuery[] = [];
  commit(query: FindQuery, key: FindKey, evaluation: HistoryEvaluation, action: 'navigate' | 'close') {
    if (!query.text || query.text.length > FIND_QUERY_LIMIT || evaluation.composing || evaluation.phase !== 'ready' ||
      !evaluation.key || !sameFindKey(key, evaluation.key) || (action === 'navigate' && !evaluation.records.length)) return;
    this.entries = [{ ...query }, ...this.entries.filter(entry => entry.text !== query.text ||
      entry.matchCase !== query.matchCase || entry.wholeWords !== query.wholeWords)].slice(0, 7);
  }
  clear() { this.entries = []; }
}
