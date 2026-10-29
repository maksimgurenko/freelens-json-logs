import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { sourceFragments } from '../core/find-presentation.ts';
import type { RecordRef } from '../core/occurrences.ts';
import type { FindSource } from '../core/find-protocol.ts';
import { bindFieldsSeed } from './find-selection.ts';

/** Stable text children are independent of query/highlight state. Source offsets
 * always address this exact string; transformed fields are deliberately unindexed.
 */
export const FindSourceText = React.memo(function FindSourceText({ text, source, record, fieldsApplication, fieldsMessage }: {
  text: string; source?: FindSource; record: RecordRef; fieldsApplication?: string; fieldsMessage?: string;
}) {
  const element = useRef<HTMLSpanElement>(null);
  const fragments = useMemo(() => sourceFragments(text), [text]);
  useLayoutEffect(() => fieldsApplication !== undefined ? bindFieldsSeed(element.current!, fieldsApplication, fieldsMessage) : undefined, [fieldsApplication, fieldsMessage]);
  return <span ref={element} data-find-seed={fieldsApplication !== undefined ? 'fields' : source ? '' : undefined} data-find-source={source} data-find-context={record.context} data-find-occurrence={record.occurrence}>
    {fragments.map(fragment => <span key={fragment.start} data-source-start={fragment.start}>{fragment.text}</span>)}
  </span>;
});
