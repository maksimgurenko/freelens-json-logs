import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { bindVisibility, type VisibilityChannel } from '../adapter/visibility.ts';
import { freelensPort, freelensRequests, PACKAGE_VERSION } from '../adapter/freelens.ts';
import { SnapshotSession, type SnapshotState } from '../core/session.ts';
import { displayTimestamp, recordFormatter } from '../core/records.ts';
import type { LogRecord } from '../core/records.ts';
import { initialInspection, originalText, selectRecord, selectedIndex, type RecordContent } from '../core/inspection.ts';
import type { ViewerPreferences } from '../core/configuration.ts';
import { copyOriginal } from '../adapter/clipboard.ts';
import type { LogTarget } from '../core/target.ts';
import { findMatches, moveMatch, retainedIndex } from '../core/navigation.ts';
import { LogViewport, type ViewportStatus } from './log-viewport.ts';
import styles from './viewer.css';
import { activeProfile, BUILTIN_PROFILE_ID, builtinProfile } from '../core/profiles.ts';
import { ProfileEditor } from './profile-editor.tsx';
import { SettingsRecovery } from './settings-recovery.tsx';
import { bindLocalEscape, focusLocal, LocalDismissal } from './local-dismissal.ts';
import { bindLocalBack } from './local-back.ts';

interface ViewerProps { target: LogTarget; register: (dispose: () => void) => () => void; visibility: VisibilityChannel; preferences: ViewerPreferences }
const EMPTY_RECORDS: readonly LogRecord[] = [];

type SelectionPosition = Pick<Selection, 'anchorNode' | 'anchorOffset' | 'focusNode' | 'focusOffset'>;
function selectionPosition(selection: Selection | null): SelectionPosition | undefined {
  if (!selection) return;
  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
  return { anchorNode, anchorOffset, focusNode, focusOffset };
}
function selectedTextTouches(row: HTMLElement, before?: SelectionPosition): boolean {
  const selection = row.ownerDocument.getSelection();
  if (!selection || selection.isCollapsed) return false;
  // A plain click may leave the old range present until after click dispatch.
  // Only a range changed by this gesture should suppress immediate inspection.
  if (before && selection.anchorNode === before.anchorNode && selection.anchorOffset === before.anchorOffset &&
    selection.focusNode === before.focusNode && selection.focusOffset === before.focusOffset) return false;
  for (let i = 0; i < selection.rangeCount; i++) {
    if (selection.getRangeAt(i).intersectsNode(row)) return true;
  }
  return false;
}

// Accepted B layout keeps frequent actions in one toolbar and presentation controls on demand.
export function Viewer({ target, register, visibility, preferences }: ViewerProps) {
  const root = useRef<HTMLElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const viewport = useRef<LogViewport>();
  const rowGesture = useRef<{ x: number; y: number; dragged: boolean; selection?: SelectionPosition }>();
  const requestedMatch = useRef<number>();
  const [scroll, setScroll] = useState<ViewportStatus>({ following: true, lost: false });
  const [query, setQuery] = useState('');
  const [findOpen, setFindOpen] = useState(false);
  const findInput = useRef<HTMLInputElement>(null);
  const findButton = useRef<HTMLButtonElement>(null);
  const [cursor, setCursor] = useState<{ records: readonly LogRecord[]; index: number }>({ records: EMPTY_RECORDS, index: -1 });
  const [state, setState] = useState<SnapshotState>();
  const [session, setSession] = useState<SnapshotSession>();
  const [timestamps, setTimestamps] = useState(true);
  const [wrap, setWrap] = useState(false);
  const [inspection, setInspection] = useState(initialInspection);
  const [preference, setPreference] = useState(() => preferences.read());
  const [editingProfiles, setEditingProfiles] = useState(false);
  const profilesActive = useRef(false);
  profilesActive.current = editingProfiles;
  const profilesButton = useRef<HTMLButtonElement>(null);
  const dismissal = useRef(new LocalDismissal()).current;
  const inspectorFocused = useRef(false);
  useEffect(() => {
    const changed = () => setPreference(preferences.read());
    const stop = preferences.subscribe(changed);
    changed();
    return stop;
  }, [preferences]);
  useEffect(() => {
    const current = new SnapshotSession(target, freelensPort, setState, freelensRequests);
    setSession(current);
    setTimestamps(true);
    setWrap(false);
    setInspection(initialInspection());
    let visible = false;
    const stopVisibility = bindVisibility(root.current!, target.clusterId, visibility, active => { visible = active; current.setActive(active); });
    const stopEscape = bindLocalEscape(root.current!, () => visible && current.state.phase !== 'closed', dismissal);
    const stopBack = bindLocalBack(root.current!, () => visible && current.state.phase !== 'closed',
      () => profilesActive.current, dismissal);
    const dispose = () => { stopBack(); stopEscape(); stopVisibility(); current.dispose(); };
    const unregister = register(dispose);
    void current.open();
    return () => { unregister(); dispose(); };
  }, [target.clusterId, target.namespace, target.podName, target.podUid, register, visibility]);
  const snapshot = state?.snapshot;
  const updateStatus = !state || state.phase === 'loading-pod' ? 'Loading Pod…'
    : state.waiting ? 'Waiting for earlier request…'
    : state.refreshing ? state.paused ? 'Paused · reading snapshot…' : 'Reading snapshot…'
    : state.paused ? 'Paused' : state.error ? 'Automatic updates stopped' : 'Automatic updates';
  const records = snapshot?.records ?? EMPTY_RECORDS;
  const profileContext = useMemo(() => ({ namespace: target.namespace, container: state?.container ?? '', labels: state?.podLabels ?? {} }),
    [target.namespace, state?.container, state?.podLabels]);
  const profile = useMemo(() => activeProfile(preference.configuration, state?.manualProfile, profileContext), [preference.configuration, state?.manualProfile, profileContext]);
  useEffect(() => {
    if (state?.manualProfile && state.manualProfile !== BUILTIN_PROFILE_ID &&
      !preference.configuration.profiles.some(profile => profile.id === state.manualProfile)) session?.selectProfile();
  }, [state?.manualProfile, preference.configuration, session]);
  useEffect(() => setEditingProfiles(false), [state?.container]);
  const formattedRecords = useMemo(() => records.map(recordFormatter(profile.format)), [records, profile.format]);
  const messages = useMemo(() => formattedRecords.map(record => record.message), [formattedRecords]);
  const matches = useMemo(() => findMatches(records, messages, query), [records, messages, query]);
  const mappedCursor = retainedIndex(cursor.records, records, cursor.index);
  const currentMatch = matches.includes(mappedCursor) ? mappedCursor : -1;
  useEffect(() => {
    setCursor(previous => previous.records === records && previous.index === currentMatch ? previous : { records, index: currentMatch });
  }, [records, currentMatch]);
  useLayoutEffect(() => {
    const current = new LogViewport(scroller.current!, setScroll);
    viewport.current = current;
    return () => { current.dispose(); viewport.current = undefined; };
  }, []);
  useLayoutEffect(() => {
    if (editingProfiles) return;
    viewport.current?.update(records);
    if (requestedMatch.current !== undefined) {
      viewport.current?.show(requestedMatch.current);
      requestedMatch.current = undefined;
    }
  });
  useLayoutEffect(() => {
    if (findOpen && !editingProfiles) findInput.current?.focus();
  }, [findOpen]);
  const navigateMatch = (direction: 1 | -1) => {
    const next = moveMatch(matches, currentMatch, direction);
    setCursor({ records, index: next });
    requestedMatch.current = next;
  };
  const changeQuery = (value: string) => {
    const first = findMatches(records, messages, value)[0] ?? -1;
    setQuery(value);
    setCursor({ records, index: first });
    requestedMatch.current = first;
  };
  const index = selectedIndex(records, inspection.selected);
  const selected = records[index];
  useEffect(() => {
    if (index < 0) {
      const element = root.current!;
      if (inspectorFocused.current && element.ownerDocument.hasFocus() &&
        (element.ownerDocument.activeElement === element.ownerDocument.body || element.contains(element.ownerDocument.activeElement))) focusLocal(element);
      setInspection(previous => previous.selected ? { ...previous, selected: undefined } : previous);
    }
  }, [snapshot, index]);
  const close = () => {
    focusLocal(root.current!, root.current?.querySelector<HTMLElement>(`.rl-record[data-record-index="${index}"] > .rl-row`));
    setInspection(previous => ({ ...previous, selected: undefined }));
  };
  const closeFind = () => { setFindOpen(false); focusLocal(root.current!, findButton.current); };
  const backToLogs = () => { setEditingProfiles(false); focusLocal(root.current!, profilesButton.current); };
  useLayoutEffect(() => dismissal.add(0, () => editingProfiles ? backToLogs : findOpen ? closeFind : selected ? close : undefined));
  const inspector = selected && <RecordInspector record={selected} content={inspection.content}
    onContent={content => setInspection(previous => ({ ...previous, content }))} onClose={close} />;
  return <section ref={root} className="readable-logs" aria-label="Readable logs" data-version={PACKAGE_VERSION}
    onFocusCapture={event => { inspectorFocused.current = !!(event.target as Element).closest('.rl-detail'); }}>
    <style>{styles}</style>
    <header className="rl-toolbar" aria-label="Log controls">
      <details className="rl-target-context">
        <summary title={`${target.clusterName} / ${target.namespace} / ${target.podName}`} aria-label="Log target details">
          <span className="rl-context-path"><span>{target.namespace}</span><span aria-hidden="true">/</span><strong>{target.podName}</strong></span>
        </summary>
        <div className="rl-identity">
          <strong>Log target</strong>
          <dl><dt>Cluster</dt><dd>{target.clusterName}</dd><dt>Namespace</dt><dd>{target.namespace}</dd>
            <dt>Pod</dt><dd>{target.podName}</dd><dt>Cluster ID</dt><dd>{target.clusterId}</dd>
            <dt>Pod UID</dt><dd>{target.podUid}</dd><dt>Active profile</dt><dd>{profile.name}</dd></dl>
        </div>
      </details>
      <div className="rl-target-group">
        <label>Container <select aria-label="Container" title={state?.container} value={state?.container ?? ''}
          disabled={!state?.containers.length || state.gone || state.phase === 'closed'}
          onChange={event => { void session?.selectContainer(event.target.value); }}>
          {!state?.container && <option value="" disabled>Select a container</option>}
          {(['regular', 'init', 'ephemeral'] as const).map(kind => <optgroup key={kind} label={kind === 'regular' ? 'Containers' : `${kind} containers`}>
            {state?.containers.filter(container => container.kind === kind).map(container => <option key={container.name} value={container.name}>{container.name}</option>)}
          </optgroup>)}
        </select></label>
      </div>
      <div className="rl-profile-group">
        <label>Profile <select aria-label="Profile" title={`${state?.manualProfile ? 'Manual' : 'Auto'} · ${profile.name}`} value={state?.manualProfile ?? ''}
          disabled={!session || state?.phase === 'closed'} onChange={event => session?.selectProfile(event.target.value || undefined)}>
          <option value="">Auto · {activeProfile(preference.configuration, undefined, profileContext).name}</option>
          {[builtinProfile(), ...preference.configuration.profiles].map(profile => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
        </select></label>
        <button ref={profilesButton} type="button" className="rl-edit-profiles" onClick={() => {
          if (editingProfiles) backToLogs();
          else { root.current?.querySelectorAll('details[open]').forEach(node => { (node as HTMLDetailsElement).open = false; }); setEditingProfiles(true); }
        }} aria-expanded={editingProfiles}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z" /></svg>
          Edit profiles
        </button>
      </div>
      <div className="rl-controls" role="group" aria-label="Log updates">
        <button type="button" disabled={!state?.container || state.gone || state.phase === 'closed'}
          onClick={() => { if (state?.paused) void session?.resume(); else session?.pause(); }}>{state?.paused ? 'Resume' : 'Pause'}</button>
        <button type="button" disabled={!state?.container || state.gone || state.phase === 'closed' || state.refreshing || state.waiting}
          onClick={() => { void session?.refresh(); }}>Refresh</button>
      </div>
      <div className="rl-presentation" hidden={editingProfiles}>
        <button ref={findButton} type="button" aria-expanded={findOpen} aria-controls="rl-findbar"
          onClick={() => { setFindOpen(true); findInput.current?.focus(); findInput.current?.select(); }}>Find</button>
        <details className="rl-display-options">
          <summary>Display options</summary>
          <div className="rl-display-panel">
            <div role="group" aria-label="Log presentation" className="rl-modes">
              <button type="button" aria-pressed={!inspection.raw} onClick={() => setInspection(previous => ({ ...previous, raw: false }))}>Readable</button>
              <button type="button" aria-pressed={inspection.raw} onClick={() => setInspection(previous => ({ ...previous, raw: true }))}>Raw</button>
            </div>
            <label><input type="checkbox" checked={timestamps} onChange={event => setTimestamps(event.target.checked)} />Show timestamps</label>
            <label><input type="checkbox" checked={wrap} onChange={event => setWrap(event.target.checked)} />Word wrap</label>
            <label>Inspection <select aria-label="Inspection" title="Saved globally, separately from formatting profiles"
              value={preference.inspection} disabled={!!preference.problem}
              onChange={event => preferences.setInspection(event.target.value as 'inline' | 'side' | 'bottom')}>
              <option value="inline">Inline expansion</option><option value="side">Side inspector</option><option value="bottom">Bottom inspector</option>
            </select></label>
          </div>
        </details>
      </div>
    </header>
    <div id="rl-findbar" className="rl-findbar" role="search" aria-label="Find in logs" hidden={editingProfiles || !findOpen}>
      <label htmlFor="rl-find">Find</label>
      <input ref={findInput} id="rl-find" type="search" aria-label="Find in logs" placeholder="Find in application text or message"
        value={query} onChange={event => changeQuery(event.target.value)}
        onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); navigateMatch(event.shiftKey ? -1 : 1); } }} />
      <span className="rl-find-count" role="status" aria-live="polite">{query ? `${currentMatch < 0 ? 0 : matches.indexOf(currentMatch) + 1} of ${matches.length} matching records` : 'Enter text to find'}</span>
      <button type="button" disabled={!matches.length} onClick={() => navigateMatch(-1)}>Previous</button>
      <button type="button" disabled={!matches.length} onClick={() => navigateMatch(1)}>Next</button>
      <button type="button" aria-label="Close Find" onClick={closeFind}>Close</button>
    </div>
    <SettingsRecovery preferences={preferences} saved={preference} dismissal={dismissal} />
    {state?.lifecycleNotice && <p className="rl-notice" role="status">{state.lifecycleNotice}{state.paused ? ' Paused; select Refresh or Resume to read the current instance.' : ''}</p>}
    {state?.slow && <p className="rl-notice" role="status">The log request is taking longer than 15 seconds. You can pause or leave this view. Another request for this target must wait for it to finish.</p>}
    {state?.phase === 'choose-container' && <p className="rl-notice" role="status">This Pod has no regular container. Select an init or ephemeral container to read its logs.</p>}
    {state?.error && <div className="rl-notice rl-error" role="alert"><strong>{state.outdated ? 'Logs are outdated · automatic updates stopped' : 'Unable to read logs'}</strong><p>{state.error}</p>
      {!state.gone && <button type="button" disabled={state.refreshing || state.waiting} onClick={() => { void session?.retry(); }}>Retry</button>}
    </div>}
    {state?.phase === 'closed' && <p className="rl-notice" role="status">Readable logs is disabled. Re-enable the extension and reopen this view.</p>}
    {snapshot?.omittedLines ? <p className="rl-notice" role="status">{snapshot.oversizedNewest
      ? 'The newest record exceeds the 5 MiB original-text budget. No complete suffix fits.'
      : `${snapshot.omittedLines.toLocaleString()} older record(s) omitted to keep the latest 1,000 lines within the 5 MiB original-text budget.`}</p> : null}
    {scroll.lost && <p className="rl-notice" role="status">Your scroll position left the recent log window. Use To bottom to follow new output.</p>}
    {editingProfiles && <ProfileEditor preferences={preferences} onClose={backToLogs} dismissal={dismissal} />}
    <div className={`rl-work rl-layout-${preference.inspection}`} hidden={editingProfiles}>
    <div ref={scroller} className={`rl-records${wrap ? ' rl-wrap' : ''}`} tabIndex={0} aria-label="Container log records"
      onPointerDownCapture={event => {
        rowGesture.current = event.button === 0 && (event.target as Element).closest('.rl-row')
          ? { x: event.clientX, y: event.clientY, dragged: false, selection: selectionPosition(event.currentTarget.ownerDocument.getSelection()) } : undefined;
      }}
      onPointerMoveCapture={event => {
        const gesture = rowGesture.current;
        if (gesture && (event.buttons & 1) && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 4) gesture.dragged = true;
      }}
      onPointerCancel={() => { rowGesture.current = undefined; }}
      aria-busy={!state || state.phase === 'loading-pod' || state.refreshing || state.waiting}>
      {snapshot && snapshot.returnedLines === 0 && <p className="rl-empty" role="status">No logs returned for {state?.container}.</p>}
      {records.map((record, recordIndex) => {
        const formatted = formattedRecords[recordIndex];
        const isSelected = recordIndex === index;
        const fields = Object.keys(formatted.additionalFields ?? {}).length;
        return <div className={`rl-record${isSelected ? ' rl-selected' : ''}${recordIndex === currentMatch ? ' rl-find-current' : ''}`} key={recordIndex} data-record-index={recordIndex}>
          <div className="rl-row" role="button" tabIndex={0} aria-pressed={isSelected}
            aria-label={`Inspect record ${recordIndex + 1}: ${formatted.message.slice(0, 100) || 'blank line'}`}
            onClick={event => {
              // Keyboard/assistive activation is intentional even with selected text.
              // Pointer selection must not rerender inspection at the end of a drag.
              if (event.detail > 0 && (event.detail > 1 || rowGesture.current?.dragged || selectedTextTouches(event.currentTarget, rowGesture.current?.selection))) return;
              setInspection(previous => ({ ...previous, selected: selectRecord(records, recordIndex) }));
            }}
            onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setInspection(previous => ({ ...previous, selected: selectRecord(records, recordIndex) })); } }}>
          {inspection.raw ? <span className="rl-message">{(timestamps ? record.transportLine : record.applicationText) || '\u00a0'}</span> : <>
          {timestamps && <time dateTime={formatted.timestamp} title={formatted.timestampSource ? `${formatted.timestampSource}: ${formatted.timestamp}` : undefined}>{displayTimestamp(formatted.timestamp)}</time>}
          <span className={`rl-level${formatted.canonicalLevel ? ` rl-severity-${formatted.canonicalLevel.toLowerCase()}` : ''}`}>{formatted.level}</span>
          <span className="rl-message">{formatted.message || '\u00a0'}</span>
          {formatted.inlineFields?.map(field => <span className="rl-inline-field" key={field.path}>{field.path}={JSON.stringify(field.value)}</span>)}
          {!!fields && <span className="rl-fields" data-label={`${fields} ${fields === 1 ? 'field' : 'fields'}`} aria-label={`${fields} additional ${fields === 1 ? 'field' : 'fields'}`} />}
          </>}
          </div>
          {isSelected && preference.inspection === 'inline' && inspector}
        </div>;
      })}
    </div>
    {preference.inspection !== 'inline' && selected && <aside className="rl-inspector" aria-label="Record inspector">
      {inspector}
    </aside>}
    </div>
    <footer className="rl-footer" hidden={editingProfiles}>
      <span role="status">{snapshot ? `${snapshot.records.length.toLocaleString()} records · ${(snapshot.retainedBytes / 1024).toFixed(1)} KiB retained` : 'One current-instance snapshot'}</span>
      <button type="button" onClick={() => viewport.current?.toBottom()}>To bottom</button>
      <span className="rl-follow-status" role="status">{scroll.following ? 'Following output' : 'Scrolled away'}</span>
      <span className="rl-update-status" role="status" title={updateStatus}>{updateStatus}</span>
      <span className="rl-version">v{PACKAGE_VERSION}</span>
    </footer>
  </section>;
}

function RecordInspector({ record, content, onContent, onClose }: {
  record: LogRecord; content: RecordContent; onContent: (value: RecordContent) => void; onClose: () => void;
}) {
  const [copyStatus, setCopyStatus] = useState('');
  useEffect(() => setCopyStatus(''), [record, content]);
  const copy = (kind: 'application' | 'transport') => {
    try { copyOriginal(record, kind); setCopyStatus(`Copied ${kind === 'application' ? 'application text' : 'transport line'}.`); }
    catch (error) { setCopyStatus(`Unable to copy: ${String(error)}`); }
  };
  return <section className="rl-detail" aria-label="Selected record">
    <header className="rl-detail-head"><strong>Record</strong><button type="button" aria-label="Close record inspector" onClick={onClose}>Close</button></header>
    <div role="group" aria-label="Record content" className="rl-detail-tabs">
      {([['fields', 'All fields'], ['application', 'Application text'], ['transport', 'Transport line']] as const).map(([key, label]) =>
        <button type="button" key={key} aria-pressed={content === key} onClick={() => onContent(key)}>{label}</button>)}
    </div>
    <div className="rl-detail-body">
      <p>{content === 'fields' ? record.parsed ? 'Complete parsed object, including extracted and hidden fields.' : 'This line is not a JSON object. Original application text:'
        : content === 'application' ? 'Exact application text; excludes the Kubernetes timestamp.' : 'Exact received line; includes the Kubernetes timestamp.'}</p>
      <pre aria-label={content === 'fields' ? 'Complete record' : content === 'application' ? 'Original application text' : 'Original transport line'}>{content === 'fields'
        ? record.parsed ? JSON.stringify(record.parsed, null, 2) : record.applicationText : originalText(record, content)}</pre>
    </div>
    <footer className="rl-copy"><button type="button" onClick={() => copy('application')}>Copy application text</button>
      <button type="button" onClick={() => copy('transport')}>Copy transport line</button>
      <span role="status">{copyStatus}</span></footer>
  </section>;
}
