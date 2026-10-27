import React, { useLayoutEffect, useRef, useState } from 'react';
import { Renderer } from '@freelensapp/extensions';
import type { FindHistory } from '../core/find-history.ts';
import type { FindQuery } from '../core/find-protocol.ts';
import { focusLocal, type LocalDismissal } from './local-dismissal.ts';

export function FindHistoryPopover({ history, visible, context, dismissal, onRecall }: {
  history: FindHistory; visible: boolean; context: string; dismissal: LocalDismissal; onRecall: (query: FindQuery) => void;
}) {
  const [open, setOpen] = useState(false);
  const [, changed] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const clock = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const close = () => { setOpen(false); focusLocal(root.current!, clock.current); };
  useLayoutEffect(() => { setOpen(false); }, [visible, context]);
  useLayoutEffect(() => dismissal.add(200, () => visible && open ? close : undefined));
  useLayoutEffect(() => {
    if (!open) return;
    (root.current!.querySelector<HTMLButtonElement>('.rl-history-entry') ?? heading.current)?.focus({ preventScroll: true });
    const outside = (event: MouseEvent) => {
      if (root.current!.contains(event.target as Node)) return;
      // A local outside click dismisses this layer before another local action.
      // Foreign host controls retain their click ownership.
      if (root.current!.closest('.readable-logs')?.contains(event.target as Node)) {
        event.preventDefault(); event.stopPropagation();
        close();
      } else setOpen(false);
    };
    const document = root.current!.ownerDocument;
    document.addEventListener('click', outside, true);
    return () => document.removeEventListener('click', outside, true);
  }, [open]);
  return <div ref={root} className="rl-find-history">
    <button ref={clock} type="button" className="rl-find-clock" aria-label="Search history" title="Search history"
      aria-expanded={open} aria-haspopup="dialog" onClick={() => { if (visible) open ? close() : setOpen(true); }}>
      <Renderer.Component.Icon material="history" />
    </button>
    {open && <section className="rl-history-popover" role="dialog" aria-label="Search history">
      <h3 ref={heading} tabIndex={-1}>Recent searches</h3>
      {history.entries.length ? <ul>{history.entries.map((entry, index) => <li key={index}>
        <button type="button" className="rl-history-entry" onClick={() => { setOpen(false); onRecall(entry); }}>
          <span className="rl-history-text">{entry.text}</span>
          <span className="rl-history-modes">{entry.matchCase ? 'Match case' : 'Ignore case'} · {entry.wholeWords ? 'Whole words' : 'Substring'}</span>
        </button>
      </li>)}</ul> : <p>No recent searches. Complete a search, then navigate or close Find.</p>}
      <button type="button" disabled={!history.entries.length} onClick={() => {
        history.clear(); changed(value => value + 1); heading.current?.focus({ preventScroll: true });
      }}>Clear history</button>
      <button type="button" aria-label="Close search history" onClick={close}>Close</button>
    </section>}
  </div>;
}
