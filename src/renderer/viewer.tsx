import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Renderer } from '@freelensapp/extensions';
import { bindVisibility, type VisibilityChannel } from '../adapter/visibility.ts';
import { freelensPort, freelensRequests, PACKAGE_VERSION } from '../adapter/freelens.ts';
import { SnapshotSession, type SnapshotState } from '../core/session.ts';
import { displayTimestamp, recordFormatter, type LogRecord } from '../core/records.ts';
import { initialInspection, originalText, type RecordContent } from '../core/inspection.ts';
import { emptyWindow, recordRef, recordIndex, type RecordRef } from '../core/occurrences.ts';
import type { ViewerPreferences } from '../core/configuration.ts';
import { copyOriginal } from '../adapter/clipboard.ts';
import type { LogTarget } from '../core/target.ts';
import { FindPosition, type FindEdit } from '../core/find-state.ts';
import { FindEditing, type FindEditTransaction } from '../core/find-editing.ts';
import { FindHistory } from '../core/find-history.ts';
import { FindHistoryPopover } from './find-history.tsx';
import { selectedFindSeed } from './find-selection.ts';
import { FindSourceText } from './find-source.tsx';
import { FindHighlights, HIGHLIGHT_LIMIT_MESSAGE, type HighlightStatus } from './find-highlights.ts';
import { FindMarks } from './find-marks.ts';
import { FindClient, FindMatching, type FindMatchingState } from './find-client.ts';
import type { FindRpc } from '../adapter/find-ipc.ts';
import { sameFindKey } from '../core/find-protocol.ts';
import { LogViewport, type ViewportStatus } from './log-viewport.ts';
import styles from './viewer.css';
import { activeProfile, BUILTIN_PROFILE_ID, builtinProfile } from '../core/profiles.ts';
import { ProfileEditor } from './profile-editor.tsx';
import { SettingsRecovery } from './settings-recovery.tsx';
import { bindLocalEscape, focusLocal, LocalDismissal } from './local-dismissal.ts';
import { bindLocalBack } from './local-back.ts';
import { bindLocalShortcuts, editable, isMac, LocalShortcuts, shortcutHint, type ShortcutCapture } from './local-shortcuts.ts';

interface ViewerProps { target: LogTarget; register: (dispose: () => void | Promise<void>) => () => void; visibility: VisibilityChannel; findRpc: FindRpc; preferences: ViewerPreferences; shortcutCapture: ShortcutCapture }
const EMPTY_WINDOW = emptyWindow('unopened');
let viewerSequence = 0;

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
export function Viewer({ target, register, visibility, findRpc, preferences, shortcutCapture }: ViewerProps) {
  const root = useRef<HTMLElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const viewport = useRef<LogViewport>();
  const markRail = useRef<HTMLDivElement>(null);
  const marks = useRef<FindMarks>();
  const markAction = useRef<(ref: RecordRef) => void>();
  const rowGesture = useRef<{ x: number; y: number; dragged: boolean; selection?: SelectionPosition }>();
  const [findPosition] = useState(() => new FindPosition());
  const [findEditing] = useState(() => new FindEditing());
  const [history] = useState(() => new FindHistory());
  const openingSelection = useRef<{ text?: string }>();
  const [, renderPosition] = useState(0);
  const positionChanged = () => renderPosition(value => value + 1);
  const rowFocusIntent = useRef(false);
  const viewActive = useRef(false);
  const [decorationActive, setDecorationActive] = useState(false);
  const findOpener = useRef<HTMLElement>();
  const [scroll, setScroll] = useState<ViewportStatus>({ following: true, lost: false });
  const [query, setQuery] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWords, setWholeWords] = useState(false);
  const [matching, setMatching] = useState<FindMatchingState>({ phase: 'empty', searching: false, records: [] });
  const [findClient] = useState(() => new FindClient(findRpc, crypto.randomUUID()));
  const [findMatching] = useState(() => new FindMatching(findClient, setMatching));
  const [viewerEpoch] = useState(() => ++viewerSequence);
  const highlights = useRef<FindHighlights>();
  const [highlightStatus, setHighlightStatus] = useState<HighlightStatus>({ message: '', retryable: false, busy: false });
  const revisions = useRef({ window: 0, message: 0, query: 0 });
  const composing = useRef(false);
  const [compositionRevision, setCompositionRevision] = useState(0);
  const explicitEdit = useRef<FindEdit>();
  const cancelFindIntents = () => findPosition.cancelSelection();

  const [findOpen, setFindOpen] = useState(false);
  const findInput = useRef<HTMLInputElement>(null);
  const findButton = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<SnapshotState>();
  const [session, setSession] = useState<SnapshotSession>();
  const [timestamps, setTimestamps] = useState(true);
  const [wrap, setWrap] = useState(false);
  const [inspection, setInspection] = useState(initialInspection);
  const window = state?.window ?? EMPTY_WINDOW;
  const [findContext, setFindContext] = useState(window.context);
  // Reset before committing replacement-instance rows, including paused/empty
  // windows. All temporary Find state belongs to this same context seam.
  const context = state?.phase === 'closed' ? `${window.context}:closed` : window.context;
  if (findContext !== context) {
    setFindContext(context);
    setQuery('');
    setCommittedQuery('');
    setMatchCase(false); setWholeWords(false); composing.current = false;
    explicitEdit.current = undefined; openingSelection.current = undefined;
    findPosition.reset(); findEditing.clear(); history.clear();
    setInspection(previous => ({ ...previous, selected: undefined }));
  }
  if (state?.gone || state?.phase === 'closed') cancelFindIntents();
  const [preference, setPreference] = useState(() => preferences.read());
  const [editingProfiles, setEditingProfiles] = useState(false);
  const profilesActive = useRef(false);
  profilesActive.current = editingProfiles;
  const profilesButton = useRef<HTMLButtonElement>(null);
  const dismissal = useRef(new LocalDismissal()).current;
  const commands = useRef(new LocalShortcuts()).current;
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const displaySummary = useRef<HTMLElement>(null);
  const shortcutsHeading = useRef<HTMLHeadingElement>(null);
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
    const stopVisibility = bindVisibility(root.current!, target.clusterId, visibility, active => { visible = active; viewActive.current = active; setDecorationActive(active); if (!active) { cancelFindIntents(); highlights.current?.suspend(); } findMatching.setActive(active); current.setActive(active); });
    const stopEscape = bindLocalEscape(root.current!, () => visible && current.state.phase !== 'closed', dismissal);
    const stopBack = bindLocalBack(root.current!, () => visible && current.state.phase !== 'closed',
      () => profilesActive.current, dismissal);
    const stopShortcuts = bindLocalShortcuts(root.current!, () => visible && current.state.phase !== 'closed', commands, shortcutCapture);
    let closing: Promise<void> | undefined;
    const dispose = () => {
      if (closing) return closing;
      stopShortcuts(); stopBack(); stopEscape(); stopVisibility(); highlights.current?.dispose(); marks.current?.dispose(); current.dispose();
      return closing = findMatching.dispose();
    };
    const unregister = register(dispose);
    void current.open();
    return () => { unregister(); dispose(); };
  }, [target.clusterId, target.namespace, target.podName, target.podUid, register, visibility]);
  const snapshot = state?.snapshot;
  const updateStatus = !state || state.phase === 'loading-pod' ? 'Loading Pod…'
    : state.waiting ? 'Waiting for earlier request…'
    : state.refreshing ? state.paused ? 'Paused · reading snapshot…' : 'Reading snapshot…'
    : state.paused ? 'Paused' : state.error ? 'Automatic updates stopped' : 'Automatic updates';
  const records = window.records;
  const profileContext = useMemo(() => ({ namespace: target.namespace, container: state?.container ?? '', labels: state?.podLabels ?? {} }),
    [target.namespace, state?.container, state?.podLabels]);
  const profile = useMemo(() => activeProfile(preference.configuration, state?.manualProfile, profileContext), [preference.configuration, state?.manualProfile, profileContext]);
  useEffect(() => {
    if (state?.manualProfile && state.manualProfile !== BUILTIN_PROFILE_ID &&
      !preference.configuration.profiles.some(profile => profile.id === state.manualProfile)) session?.selectProfile();
  }, [state?.manualProfile, preference.configuration, session]);
  useEffect(() => setEditingProfiles(false), [state?.container]);
  const formattedRecords = useMemo(() => records.map(recordFormatter(profile.format)), [records, profile.format]);
  const previousMessages = useRef<readonly string[]>([]);
  const messages = useMemo(() => {
    const next = formattedRecords.map(record => record.message), previous = previousMessages.current;
    // Layout and settings synchronization can recreate the formatting objects
    // without changing any searchable text or an explicit query's intent.
    if (next.length === previous.length && next.every((message, index) => message === previous[index])) return previous;
    previousMessages.current = next;
    return next;
  }, [formattedRecords]);
  const windowRevision = useMemo(() => ++revisions.current.window, [window]);
  const messageRevision = useMemo(() => ++revisions.current.message, [messages]);
  const queryRevision = useMemo(() => ++revisions.current.query, [committedQuery, matchCase, wholeWords, compositionRevision]);
  const findInputs = useMemo(() => ({
    key: { viewerEpoch, targetEpoch: 1, instanceEpoch: state?.instanceEpoch ?? 0, windowRevision, messageRevision, queryRevision },
    query: { text: committedQuery, matchCase, wholeWords },
    records: records.map((record, index) => ({ ref: window.refs[index], application: record.applicationText, message: messages[index] })),
  }), [viewerEpoch, state?.instanceEpoch, windowRevision, messageRevision, queryRevision]);
  useLayoutEffect(() => {
    if (!composing.current) findMatching.setComposing(false);
    const edit = explicitEdit.current ?? 'maintenance';
    findPosition.prepare(window, findInputs.key, edit);
    if (!findOpen || editingProfiles || !viewActive.current) findPosition.cancelSelection();
    if (!committedQuery) findPosition.clear();
    explicitEdit.current = undefined;
    findMatching.update(findInputs, edit === 'maintenance' ? 'maintenance' : 'edit');
    positionChanged();
  }, [findInputs]);
  const matchesReady = matching.phase === 'ready' && !!matching.key && sameFindKey(matching.key, findInputs.key) && !composing.current;
  // Project confirmed retained matches before the maintenance effect runs too,
  // so React never removes/recreates unchanged hints between snapshot commits.
  const knownMatches = useMemo(() => !composing.current ? findMatching.knownMatches(findInputs) : undefined, [findInputs, matching, compositionRevision]);
  const matchesByOccurrence = useMemo(() => new Map(knownMatches?.map(match => [match.ref.occurrence, match])), [knownMatches]);
  const matches = useMemo(() => window.refs.flatMap((ref, index) => matchesByOccurrence.has(ref.occurrence) ? [index] : []), [matchesByOccurrence, window]);
  useLayoutEffect(() => {
    if (!matchesReady) return;
    findPosition.accept(findInputs.key, matching.records.map(match => match.ref));
    positionChanged();
  }, [matching]);
  const mappedCursor = recordIndex(window, findPosition.active);
  const currentMatch = matches.includes(mappedCursor) ? mappedCursor : -1;
  const findDecorationsVisible = findOpen && !editingProfiles && decorationActive;
  useLayoutEffect(() => {
    const current = new FindHighlights(root.current!, findClient, viewerEpoch, setHighlightStatus);
    highlights.current = current;
    return () => { current.dispose(); highlights.current = undefined; };
  }, []);
  useLayoutEffect(() => {
    highlights.current?.update(findDecorationsVisible && ['ready', 'pending'].includes(matching.phase) && !composing.current ? findInputs : undefined,
      knownMatches ?? [], findPosition.active, !matchesReady);
  }, [findInputs, matchesReady, matching.phase, matching.records, findDecorationsVisible, inspection, timestamps, wrap, preference.inspection, currentMatch]);
  useLayoutEffect(() => {
    const current = new LogViewport(scroller.current!, setScroll, () => findPosition.cancelReveal());
    viewport.current = current;
    return () => { current.dispose(); viewport.current = undefined; };
  }, []);
  useLayoutEffect(() => {
    const current = new FindMarks(scroller.current!, markRail.current!, ref => markAction.current?.(ref));
    marks.current = current;
    return () => { current.dispose(); marks.current = undefined; };
  }, []);
  useLayoutEffect(() => {
    marks.current?.update(window, findDecorationsVisible ? (knownMatches ?? []).map(match => match.ref) : [], findPosition.active, queryRevision, matchesReady);
  }, [window, matchesReady, matching.records, findDecorationsVisible, currentMatch, inspection, timestamps, wrap, preference.inspection, formattedRecords, queryRevision]);
  useLayoutEffect(() => {
    if (editingProfiles) return;
    viewport.current?.update(window);
  }, [window, editingProfiles, inspection, timestamps, wrap, preference.inspection, formattedRecords, matchesReady, matching.records]);
  useLayoutEffect(() => {
    if (editingProfiles) return;
    const reveal = findPosition.takeReveal(window, findInputs.key);
    if (findOpen && !state?.gone && state?.phase !== 'closed' && reveal) viewport.current?.show(reveal);
  });
  useLayoutEffect(() => {
    if (findOpen && !editingProfiles) { findInput.current?.focus(); findInput.current?.select(); }
  }, [findOpen]);
  const navigateMatch = (target: 1 | -1 | RecordRef) => {
    if (!matchesReady || !matches.length) return;
    commitHistory('navigate');
    findPosition.navigate(target); positionChanged();
    findInput.current?.focus({ preventScroll: true });
  };
  markAction.current = ref => navigateMatch(ref);
  const commitEdit = (transaction?: FindEditTransaction) => {
    if (!transaction) return;
    cancelFindIntents();
    explicitEdit.current = transaction.edit;
    setCommittedQuery(transaction.text); setCompositionRevision(value => value + 1);
  };
  const changeQuery = (value: string, inputType: string) => {
    const transaction = findEditing.change(value, inputType);
    if (composing.current || transaction) setQuery(value);
    commitEdit(transaction);
  };
  // Native input still carries an edit when select-all replacement inserts the
  // same text. React's change deduplication alone would discard that sequence.
  const handleFindInput = (event: React.FormEvent<HTMLInputElement>) =>
    changeQuery(event.currentTarget.value, (event.nativeEvent as InputEvent).inputType);
  const changeMode = (mode: 'case' | 'words') => {
    cancelFindIntents(); explicitEdit.current = 'refine';
    if (mode === 'case') setMatchCase(value => !value); else setWholeWords(value => !value);
  };
  const clearFind = () => {
    composing.current = false; findMatching.setComposing(false); cancelFindIntents(); explicitEdit.current = undefined;
    findEditing.clear(); findPosition.clear();
    setQuery(''); setCommittedQuery(''); positionChanged();
    findInput.current?.focus({ preventScroll: true });
  };
  const findStatus = matching.phase === 'too-long' ? 'Find is limited to 16,384 UTF-16 units. Shorten the query to search.'
    : matching.phase === 'timeout' ? 'Find timed out. Edit the query or Retry.'
    : matching.phase === 'execution' ? 'Find could not complete. Edit the query or Retry.'
    : !query ? 'Enter text to find'
    : !matchesReady ? matching.searching ? 'Searching…' : 'Matching pending'
    : `${currentMatch < 0 ? 0 : matches.indexOf(currentMatch) + 1} of ${matches.length} matching records`;
  const findError = ['too-long', 'timeout', 'execution'].includes(matching.phase);
  const feedback = findPosition.feedback;
  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setAnnouncement(`${findStatus}${feedback ? `. ${feedback}` : ''}`), 100);
    return () => clearTimeout(timer);
  }, [findStatus, feedback]);
  const index = recordIndex(window, inspection.selected);
  const selected = records[index];
  const toggleInspection = (recordIndex: number) => {
    const ref = recordRef(window, recordIndex)!;
    if (recordIndex === index) findPosition.closeInspection(ref); else findPosition.read(ref);
    positionChanged();
    setInspection(previous => ({ ...previous, selected: recordIndex === index
      ? undefined : recordRef(window, recordIndex) }));
    if (recordIndex === index) { rowFocusIntent.current = false; focusLocal(root.current!, scroller.current); }
  };
  useEffect(() => {
    if (index < 0) {
      const element = root.current!;
      if (inspectorFocused.current && element.ownerDocument.hasFocus() &&
        (element.ownerDocument.activeElement === element.ownerDocument.body || element.contains(element.ownerDocument.activeElement))) focusLocal(element);
      setInspection(previous => previous.selected ? { ...previous, selected: undefined } : previous);
    }
  }, [snapshot, index]);
  const close = () => {
    findPosition.closeInspection(inspection.selected); positionChanged(); rowFocusIntent.current = false;
    setInspection(previous => ({ ...previous, selected: undefined }));
    focusLocal(root.current!, root.current?.querySelector<HTMLElement>(`.rl-record[data-record-index="${index}"] > .rl-row`));
  };
  const openFind = (fromPointer = false) => {
    const seed = fromPointer && openingSelection.current ? openingSelection.current : { text: selectedFindSeed(root.current!) };
    openingSelection.current = undefined;
    if (!findOpen) findOpener.current = root.current!.ownerDocument.activeElement as HTMLElement;
    if (!query && seed.text !== undefined) changeQuery(seed.text, 'insertFromPaste');
    rowFocusIntent.current = false; setFindOpen(true); findInput.current?.focus({ preventScroll: true }); findInput.current?.select();
  };
  useEffect(() => {
    const input = findInput.current!;
    const beforeInput = (event: InputEvent) => findEditing.beforeInput(event.inputType, input.value, input.selectionStart, input.selectionEnd);
    input.addEventListener('beforeinput', beforeInput);
    return () => input.removeEventListener('beforeinput', beforeInput);
  }, []);
  useEffect(() => {
    const document = root.current!.ownerDocument;
    const keydown = (event: KeyboardEvent) => {
      rowFocusIntent.current = viewActive.current && event.key === 'Tab' && !event.ctrlKey && !event.metaKey && !event.altKey &&
        !event.isComposing && event.keyCode !== 229 && !event.getModifierState('AltGraph');
    };
    const clear = () => { rowFocusIntent.current = false; };
    document.addEventListener('keydown', keydown, true);
    document.addEventListener('keyup', clear, true);
    document.addEventListener('pointerdown', clear, true);
    document.addEventListener('focusin', clear);
    document.defaultView?.addEventListener('blur', clear);
    return () => {
      document.removeEventListener('keydown', keydown, true);
      document.removeEventListener('keyup', clear, true);
      document.removeEventListener('pointerdown', clear, true);
      document.removeEventListener('focusin', clear);
      document.defaultView?.removeEventListener('blur', clear);
    };
  }, []);
  const closeShortcuts = () => { setShortcutsOpen(false); focusLocal(root.current!, displaySummary.current); };
  useLayoutEffect(() => dismissal.add(300, () => shortcutsOpen ? closeShortcuts : undefined));
  useLayoutEffect(() => { if (shortcutsOpen) shortcutsHeading.current?.focus(); }, [shortcutsOpen]);
  useLayoutEffect(() => {
    const reading = (target: Element) => !editingProfiles && (!editable(target) || target === findInput.current);
    const stops = [commands.add('find', target => reading(target) ? openFind : undefined),
      ...(['next', 'previous'] as const).map(command => commands.add(command, target => reading(target) ? () => {
        if (!findOpen) { findOpener.current = target as HTMLElement; setFindOpen(true); }
        if (query) navigateMatch(command === 'next' ? 1 : -1);
      } : undefined)),
      commands.add('bottom', target => !editingProfiles && (target === scroller.current || target.matches('.rl-row'))
        ? () => viewport.current?.toBottom() : undefined)];
    return () => { stops.forEach(stop => stop()); };
  });
  const commitHistory = (action: 'navigate' | 'close') => {
    history.commit(findInputs.query, findInputs.key, { ...matching, composing: composing.current }, action);
  };
  const recallHistory = (entry: typeof findInputs.query) => {
    composing.current = false; findMatching.setComposing(false);
    findEditing.clear();
    setMatchCase(entry.matchCase); setWholeWords(entry.wholeWords);
    changeQuery(entry.text, 'insertFromPaste');
    rowFocusIntent.current = false; findInput.current?.focus({ preventScroll: true });
  };
  const closeFind = () => { commitHistory('close'); cancelFindIntents(); rowFocusIntent.current = false; setFindOpen(false); focusLocal(root.current!, findOpener.current); };
  const backToLogs = () => { setEditingProfiles(false); focusLocal(root.current!, profilesButton.current); };
  useLayoutEffect(() => dismissal.add(0, () => editingProfiles ? backToLogs : findOpen ? closeFind : selected ? close : undefined));
  const inspector = selected && <RecordInspector record={selected} recordReference={window.refs[index]} message={messages[index]} content={inspection.content}
    onContent={content => setInspection(previous => ({ ...previous, content }))} onClose={close} />;
  return <section ref={root} className="readable-logs" aria-label="Readable logs" data-version={PACKAGE_VERSION}
    onPointerDownCapture={() => { rowFocusIntent.current = false; }}
    onFocusCapture={event => {
      inspectorFocused.current = !!(event.target as Element).closest('.rl-detail');
      if (rowFocusIntent.current && (event.target as Element).matches('.rl-row')) {
        const row = (event.target as Element).closest<HTMLElement>('[data-record-index]');
        const ref = recordRef(window, Number(row?.dataset.recordIndex));
        if (ref) { findPosition.read(ref); positionChanged(); }
      }
      rowFocusIntent.current = false;
    }}>
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
        <label>Container <span className="rl-toolbar-select"><select aria-label="Container" title={state?.container} value={state?.container ?? ''}
          disabled={!state?.containers.length || state.gone || state.phase === 'closed'}
          onChange={event => { void session?.selectContainer(event.target.value); }}>
          {!state?.container && <option value="" disabled>Select a container</option>}
          {(['regular', 'init', 'ephemeral'] as const).map(kind => <optgroup key={kind} label={kind === 'regular' ? 'Containers' : `${kind} containers`}>
            {state?.containers.filter(container => container.kind === kind).map(container => <option key={container.name} value={container.name}>{container.name}</option>)}
          </optgroup>)}
        </select><Renderer.Component.Icon material="keyboard_arrow_down" /></span></label>
      </div>
      <div className="rl-profile-group">
        <label>Profile <span className="rl-toolbar-select"><select aria-label="Profile" title={`${state?.manualProfile ? 'Manual' : 'Auto'} · ${profile.name}`} value={state?.manualProfile ?? ''}
          disabled={!session || state?.phase === 'closed'} onChange={event => session?.selectProfile(event.target.value || undefined)}>
          <option value="">Auto · {activeProfile(preference.configuration, undefined, profileContext).name}</option>
          {[builtinProfile(), ...preference.configuration.profiles].map(profile => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
        </select><Renderer.Component.Icon material="keyboard_arrow_down" /></span></label>
        <button ref={profilesButton} type="button" className="rl-icon-button" aria-label="Edit profiles" title="Edit profiles" onClick={() => {
          if (editingProfiles) backToLogs();
          else { cancelFindIntents(); root.current?.querySelectorAll('details[open]').forEach(node => { (node as HTMLDetailsElement).open = false; }); setEditingProfiles(true); }
        }} aria-expanded={editingProfiles}>
          <Renderer.Component.Icon material="edit" />
        </button>
      </div>
      <div className="rl-controls" role="group" aria-label="Log updates">
        <button type="button" className="rl-icon-button" aria-label={state?.paused ? 'Resume' : 'Pause'}
          title={state?.paused ? 'Resume automatic updates' : 'Pause automatic updates'}
          disabled={!state?.container || state.gone || state.phase === 'closed'}
          onClick={() => { if (state?.paused) void session?.resume(); else session?.pause(); }}>
          <Renderer.Component.Icon material={state?.paused ? 'play_arrow' : 'pause'} />
        </button>
        <button type="button" className="rl-icon-button" aria-label="Refresh" title="Refresh logs"
          disabled={!state?.container || state.gone || state.phase === 'closed' || state.refreshing || state.waiting}
          onClick={() => { void session?.refresh(); }}><Renderer.Component.Icon material="refresh" /></button>
      </div>
      <div className="rl-presentation" hidden={editingProfiles}>
        <button ref={findButton} type="button" className="rl-icon-button" aria-label="Find" aria-expanded={findOpen} aria-controls="rl-findbar"
          onPointerDown={event => { if (event.button === 0) openingSelection.current = { text: selectedFindSeed(root.current!) }; }}
          onPointerCancel={() => { openingSelection.current = undefined; }}
          title={`Find (${shortcutHint('F')})`} aria-keyshortcuts={isMac() ? 'Meta+f' : 'Control+f'} onClick={event => openFind(event.detail > 0)}>
          <Renderer.Component.Icon material="search" />
        </button>
        <details className="rl-display-options">
          <summary ref={displaySummary} className="rl-icon-button" aria-label="Display options" title="Display options">
            <Renderer.Component.Icon material="settings" />
          </summary>
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
            <button type="button" onClick={() => {
              root.current?.querySelectorAll('details[open]').forEach(node => { (node as HTMLDetailsElement).open = false; });
              setShortcutsOpen(true);
            }}>Shortcuts</button>
          </div>
        </details>
      </div>
    </header>
    {shortcutsOpen && <section className="rl-shortcuts" aria-label="Keyboard shortcuts" tabIndex={-1}>
      <header className="rl-editor-head"><h2 ref={shortcutsHeading} tabIndex={-1}>Keyboard shortcuts</h2>
        <button type="button" aria-label="Close shortcuts" title="Close shortcuts (Escape)" onClick={closeShortcuts}>Close</button></header>
      <dl>
        <dt>Find in logs</dt><dd><kbd>{shortcutHint('F')}</kbd></dd>
        <dt>Next / previous match</dt><dd><kbd>{shortcutHint('G')}</kbd> / <kbd>{shortcutHint('Shift+G')}</kbd></dd>
        <dt>In the Find input</dt><dd><kbd>{isMac() ? 'Return' : 'Enter'}</kbd> / <kbd>Shift+{isMac() ? 'Return' : 'Enter'}</kbd></dd>
        <dt>Save a Profiles draft</dt><dd><kbd>{shortcutHint('S')}</kbd></dd>
        <dt>Follow from a log row or viewport</dt><dd><kbd>{shortcutHint(isMac() ? 'Down' : 'End')}</kbd></dd>
        <dt>Close one local context / return to logs</dt><dd><kbd>Escape</kbd></dd>
        <dt>Host Back / Forward</dt><dd><kbd>{shortcutHint('[')}</kbd> / <kbd>{shortcutHint(']')}</kbd></dd>
      </dl>
      <p>Find commands work in logs, including the toolbar and inspector. Save works only with an active Profiles draft. Editing controls and native menus keep their own keys.</p>
      <p>To bottom follows retained logs without resuming paused updates. Reload ({shortcutHint('R')}) and the command palette ({shortcutHint('Shift+P')}) belong to Freelens.</p>
    </section>}
    <div id="rl-findbar" className="rl-findbar" role="search" aria-label="Find in logs" hidden={editingProfiles || !findOpen}>
      <label className="rl-sr-only" htmlFor="rl-find">Find</label>
      <div className="rl-find-input">
        <input ref={findInput} id="rl-find" type="search" aria-label="Find in logs" aria-describedby="rl-find-status" placeholder="Search retained logs"
          title={`Next: Enter or ${shortcutHint('G')}; previous: Shift+Enter or ${shortcutHint('Shift+G')}`} value={query}
          onCompositionStart={event => {
            const input = event.currentTarget;
            findEditing.startComposition(input.value, input.selectionStart, input.selectionEnd);
            composing.current = true; cancelFindIntents(); findMatching.setComposing(true);
          }}
          onCompositionEnd={event => {
            if (!composing.current) return;
            composing.current = false; findMatching.setComposing(false);
            const transaction = findEditing.endComposition(event.currentTarget.value);
            if (transaction) setQuery(transaction.text);
            commitEdit(transaction);
          }} onInput={handleFindInput} onChange={handleFindInput} />
        <span className="rl-find-ordinal" aria-hidden="true" title={findStatus}>
          {query && knownMatches !== undefined ? `${currentMatch < 0 ? 0 : matches.indexOf(currentMatch) + 1} / ${matches.length}` : matching.searching ? '…' : '– / –'}
        </span>
        <button type="button" className="rl-find-button rl-find-clear" aria-label="Clear Find" title="Clear search" disabled={!query} onClick={clearFind}>
          <Renderer.Component.Icon material="close" />
        </button>
      </div>
      <div className="rl-find-actions">
        {([-1, 1] as const).map(direction => <button key={direction} type="button" className="rl-find-button rl-find-direction"
          aria-label={direction === 1 ? 'Next match' : 'Previous match'} title={direction === 1 ? 'Next match (Enter)' : 'Previous match (Shift+Enter)'}
          disabled={!matchesReady || !matches.length} onClick={() => navigateMatch(direction)}>
          <Renderer.Component.Icon material={direction === 1 ? 'keyboard_arrow_down' : 'keyboard_arrow_up'} />
        </button>)}
        <button type="button" className="rl-find-button" aria-label="Match case" title="Match case" aria-pressed={matchCase} onClick={() => changeMode('case')}>Aa</button>
        <button type="button" aria-label="Whole words" title="Whole words" className="rl-find-button rl-find-words" aria-pressed={wholeWords} onClick={() => changeMode('words')}>ab</button>
        <FindHistoryPopover history={history} visible={findOpen && !editingProfiles && viewActive.current}
          context={context} dismissal={dismissal} onRecall={recallHistory} />
        <button type="button" className="rl-find-button" aria-label="Close Find" title="Close Find (Escape)" onClick={closeFind}>
          <Renderer.Component.Icon material="close" />
        </button>
      </div>
      <span id="rl-find-status" className="rl-find-count rl-sr-only">{findStatus}</span>
      {findError && <span className="rl-find-feedback">{findStatus}
        {['timeout', 'execution'].includes(matching.phase) && <button type="button" onClick={() => { cancelFindIntents(); findMatching.update(findInputs, 'retry'); }}>Retry</button>}
      </span>}
      {feedback && <span className="rl-find-feedback">{feedback}</span>}
      <span className="rl-highlight-status" role="status" aria-busy={highlightStatus.busy} data-reserve={HIGHLIGHT_LIMIT_MESSAGE}>
        <span>{highlightStatus.message}
        {highlightStatus.retryable && <button type="button" onClick={() => highlights.current?.retry()}>Retry highlights</button>}
        </span>
      </span>
      <span className="rl-sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
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
    {editingProfiles && <ProfileEditor preferences={preferences} onClose={backToLogs} dismissal={dismissal} commands={commands} />}
    <div className={`rl-work rl-layout-${preference.inspection}`} hidden={editingProfiles}>
    <div className="rl-log-pane">
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
        const ref = window.refs[recordIndex];
        const match = findDecorationsVisible ? matchesByOccurrence.get(ref.occurrence) : undefined;
        const hiddenSource = inspection.raw ? match?.message && !match.application ? 'message' : undefined
          : match?.application && !match.message ? 'application' : undefined;
        return <div className={`rl-record${isSelected ? ' rl-selected' : ''}${findDecorationsVisible && recordIndex === currentMatch ? ' rl-find-current' : ''}`} key={`${ref.context}:${ref.occurrence}`} data-record-index={recordIndex}>
          <div className="rl-row" role="button" tabIndex={0} aria-pressed={isSelected}
            aria-label={`Inspect record ${recordIndex + 1}: ${formatted.message.slice(0, 100) || 'blank line'}`}
            onClick={event => {
              // Keyboard/assistive activation is intentional even with selected text.
              // Pointer selection must not rerender inspection at the end of a drag.
              if (event.detail > 0 && (event.detail > 1 || rowGesture.current?.dragged || selectedTextTouches(event.currentTarget, rowGesture.current?.selection))) return;
              toggleInspection(recordIndex);
            }}
            onKeyDown={event => {
              if ((event.key === 'Enter' || event.key === ' ') && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey &&
                !event.nativeEvent.isComposing && event.keyCode !== 229 && !event.getModifierState('AltGraph')) {
                event.preventDefault(); toggleInspection(recordIndex);
              }
            }}>
          {inspection.raw ? <span className="rl-message" data-find-seed={record.applicationText ? '' : undefined}>
            {timestamps && record.transportLine.slice(0, record.transportLine.length - record.applicationText.length)}
            <FindSourceText text={record.applicationText} record={ref} source="application" />
          </span> : <>
          {timestamps && <time dateTime={formatted.timestamp} title={formatted.timestampSource ? `${formatted.timestampSource}: ${formatted.timestamp}` : undefined}>{displayTimestamp(formatted.timestamp)}</time>}
          <span className={`rl-level${formatted.canonicalLevel ? ` rl-severity-${formatted.canonicalLevel.toLowerCase()}` : ''}`}>{formatted.level}</span>
          <span className="rl-message"><FindSourceText text={formatted.message} record={ref} source="message" /></span>
          {formatted.inlineFields?.map(field => <span className="rl-inline-field" key={field.path}>{field.path}=<span data-find-seed="">{JSON.stringify(field.value)}</span></span>)}
          {!!fields && <span className="rl-fields" data-label={`${fields} ${fields === 1 ? 'field' : 'fields'}`} aria-label={`${fields} additional ${fields === 1 ? 'field' : 'fields'}`} />}
          </>}
          {hiddenSource && <button type="button" className="rl-match-hint" data-label={hiddenSource === 'application' ? 'Match in original text' : 'Match in extracted message'}
            aria-label={hiddenSource === 'application' ? 'Match in original text' : 'Match in extracted message'}
            onKeyDown={event => event.stopPropagation()} onClick={event => {
              event.stopPropagation(); rowFocusIntent.current = false;
              setInspection(previous => ({ ...previous, selected: ref, content: hiddenSource }));
            }} />}
          </div>
          {isSelected && preference.inspection === 'inline' && inspector}
        </div>;
      })}
    </div>
    <div ref={markRail} className="rl-find-marks" role="group" aria-label="Find matching records" />
    </div>
    {preference.inspection !== 'inline' && selected && <aside className="rl-inspector" aria-label="Record inspector">
      {inspector}
    </aside>}
    </div>
    <footer className="rl-footer" hidden={editingProfiles}>
      <span role="status">{snapshot ? `${snapshot.records.length.toLocaleString()} records · ${(snapshot.retainedBytes / 1024).toFixed(1)} KiB retained` : 'One current-instance snapshot'}</span>
      <button type="button" title={`To bottom (${shortcutHint(isMac() ? 'Down' : 'End')} from a log row or viewport)`} onClick={() => viewport.current?.toBottom()}>To bottom</button>
      <span className="rl-follow-status" role="status">{scroll.following ? 'Following output' : 'Scrolled away'}</span>
      <span className="rl-update-status" role="status" title={updateStatus}>{updateStatus}</span>
      <span className="rl-version">v{PACKAGE_VERSION}</span>
    </footer>
  </section>;
}

function RecordInspector({ record, recordReference, message, content, onContent, onClose }: {
  record: LogRecord; recordReference: RecordRef; message: string; content: RecordContent; onContent: (value: RecordContent) => void; onClose: () => void;
}) {
  const [copyStatus, setCopyStatus] = useState('');
  useEffect(() => setCopyStatus(''), [record, content]);
  const copy = (kind: 'application' | 'transport') => {
    try { copyOriginal(record, kind); setCopyStatus(`Copied ${kind === 'application' ? 'application text' : 'transport line'}.`); }
    catch (error) { setCopyStatus(`Unable to copy: ${String(error)}`); }
  };
  return <section className="rl-detail" aria-label="Selected record" tabIndex={-1}>
    <header className="rl-detail-head"><strong>Record</strong><button type="button" aria-label="Close record inspector" onClick={onClose}>Close</button></header>
    <div role="group" aria-label="Record content" className="rl-detail-tabs">
      {([['fields', 'All fields'], ['application', 'Application text'], ['transport', 'Transport line'], ['message', 'Extracted message']] as const).map(([key, label]) =>
        <button type="button" key={key} aria-pressed={content === key} onClick={() => onContent(key)}>{label}</button>)}
    </div>
    <div className="rl-detail-body">
      <p>{content === 'fields' ? record.parsed ? 'Complete parsed object, including extracted and hidden fields.' : 'This line is not a JSON object. Original application text:'
        : content === 'application' ? 'Exact application text; excludes the Kubernetes timestamp.'
        : content === 'message' ? 'Exact extracted message from the active formatting profile.' : 'Exact received line; includes the Kubernetes timestamp.'}</p>
      <pre aria-label={content === 'fields' ? 'Complete record' : content === 'application' ? 'Original application text' : content === 'message' ? 'Extracted message' : 'Original transport line'}>
        {content === 'transport' && <span data-find-seed="">{record.transportLine.slice(0, record.transportLine.length - record.applicationText.length)}</span>}
        <FindSourceText record={recordReference} source={content === 'message' ? 'message' : content === 'fields' && record.parsed ? undefined : 'application'}
          fieldsApplication={content === 'fields' && record.parsed ? record.applicationText : undefined}
          fieldsMessage={content === 'fields' && record.parsed ? message : undefined}
          text={content === 'fields' ? record.parsed ? JSON.stringify(record.parsed, null, 2) : record.applicationText : content === 'message' ? message : originalText(record, 'application')} />
      </pre>
    </div>
    <footer className="rl-copy"><button type="button" onClick={() => copy('application')}>Copy application text</button>
      <button type="button" onClick={() => copy('transport')}>Copy transport line</button>
      <span role="status">{copyStatus}</span></footer>
  </section>;
}
