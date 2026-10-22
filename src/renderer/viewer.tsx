import React, { useEffect, useState } from 'react';
import { freelensPort, freelensRequests, PACKAGE_VERSION } from '../adapter/freelens.ts';
import { SnapshotSession, type SnapshotState } from '../core/session.ts';
import { displayTimestamp, formatDefault } from '../core/records.ts';
import type { LogTarget } from '../core/target.ts';
import styles from './viewer.css';

interface ViewerProps { target: LogTarget; register: (dispose: () => void) => () => void }

// Extend the accepted native-like surface: target strip, compact time/level/message rows,
// quiet footer and explicit snapshot refresh controls.
export function Viewer({ target, register }: ViewerProps) {
  const [state, setState] = useState<SnapshotState>();
  const [session, setSession] = useState<SnapshotSession>();
  const [timestamps, setTimestamps] = useState(true);
  const [wrap, setWrap] = useState(false);
  useEffect(() => {
    const current = new SnapshotSession(target, freelensPort, setState, freelensRequests);
    setSession(current);
    setTimestamps(true);
    setWrap(false);
    const unregister = register(() => current.dispose());
    void current.open();
    return () => { unregister(); current.dispose(); };
  }, [target.clusterId, target.namespace, target.podName, target.podUid, register]);
  const snapshot = state?.snapshot;
  return <section className="readable-logs" aria-label="Readable logs" data-version={PACKAGE_VERSION}>
    <style>{styles}</style>
    <header className="rl-heading">
      <h1>Readable logs</h1>
      <p>{target.clusterName} / {target.namespace} / {target.podName}</p>
    </header>
    <div className="rl-target">
      <strong title={`Pod UID: ${target.podUid}`}>{target.podName}</strong>
      <label>Container <select aria-label="Container" value={state?.container ?? ''}
        disabled={!state?.containers.length || state.phase === 'closed'}
        onChange={event => { void session?.selectContainer(event.target.value); }}>
        {!state?.container && <option value="" disabled>Select a container</option>}
        {(['regular', 'init', 'ephemeral'] as const).map(kind => <optgroup key={kind} label={kind === 'regular' ? 'Containers' : `${kind} containers`}>
          {state?.containers.filter(container => container.kind === kind).map(container => <option key={container.name} value={container.name}>{container.name}</option>)}
        </optgroup>)}
      </select></label>
      <span className="rl-profile">Profile <strong>Default</strong></span>
      <div className="rl-controls" role="group" aria-label="Log updates">
        <button type="button" disabled={!state?.container || state.phase === 'closed'}
          onClick={() => { if (state?.paused) void session?.resume(); else session?.pause(); }}>{state?.paused ? 'Resume' : 'Pause'}</button>
        <button type="button" disabled={!state?.container || state.phase === 'closed' || state.refreshing || state.waiting}
          onClick={() => { void session?.refresh(); }}>Refresh</button>
        <span role="status">{state?.paused ? 'Paused' : state?.error ? 'Automatic updates stopped' : 'Automatic updates'}</span>
      </div>
    </div>
    <div className="rl-identity">Cluster {target.clusterId} · Pod UID {target.podUid}</div>
    {(!state || state.phase === 'loading-pod') && <p className="rl-notice" role="status">Loading Pod…</p>}
    {state?.refreshing && <p className="rl-notice" role="status">Reading log snapshot…</p>}
    {state?.waiting && <p className="rl-notice" role="status">Waiting for the earlier request to finish before fetching fresh logs…</p>}
    {state?.slow && <p className="rl-notice" role="status">The log request is taking longer than 15 seconds. You can pause or leave this view. Another request for this target must wait for it to finish.</p>}
    {state?.phase === 'choose-container' && <p className="rl-notice" role="status">This Pod has no regular container. Select an init or ephemeral container to read its logs.</p>}
    {state?.error && <div className="rl-notice rl-error" role="alert"><strong>{state.outdated ? 'Logs are outdated · automatic updates stopped' : 'Unable to read logs'}</strong><p>{state.error}</p>
      <button type="button" disabled={state.refreshing || state.waiting} onClick={() => { void session?.retry(); }}>Retry</button>
    </div>}
    {state?.phase === 'closed' && <p className="rl-notice" role="status">Readable logs is disabled. Re-enable the extension and reopen this view.</p>}
    {snapshot?.omittedLines ? <p className="rl-notice" role="status">{snapshot.oversizedNewest
      ? 'The newest record exceeds the 5 MiB original-text budget. No complete suffix fits.'
      : `${snapshot.omittedLines.toLocaleString()} older record(s) omitted to keep the latest 1,000 lines within the 5 MiB original-text budget.`}</p> : null}
    {snapshot && snapshot.returnedLines === 0 && <p className="rl-empty" role="status">No logs returned for {state?.container}.</p>}
    <div className={`rl-records${wrap ? ' rl-wrap' : ''}`} tabIndex={0} aria-label="Container log records">
      {snapshot?.records.map((record, index) => {
        const formatted = formatDefault(record);
        return <div className="rl-row" key={index} data-record-index={index}>
          {timestamps && <time dateTime={formatted.timestamp} title={formatted.timestampSource ? `${formatted.timestampSource}: ${formatted.timestamp}` : undefined}>{displayTimestamp(formatted.timestamp)}</time>}
          <span className={`rl-level${formatted.canonicalLevel ? ` rl-severity-${formatted.canonicalLevel.toLowerCase()}` : ''}`}>{formatted.level}</span>
          <span className="rl-message">{formatted.message || '\u00a0'}</span>
        </div>;
      })}
    </div>
    <footer className="rl-footer">
      <span role="status">{snapshot ? `${snapshot.records.length.toLocaleString()} records · ${(snapshot.retainedBytes / 1024).toFixed(1)} KiB retained` : 'One current-instance snapshot'}</span>
      <label><input type="checkbox" checked={timestamps} onChange={event => setTimestamps(event.target.checked)} />Show timestamps</label>
      <label><input type="checkbox" checked={wrap} onChange={event => setWrap(event.target.checked)} />Word wrap</label>
      <span className="rl-version">v{PACKAGE_VERSION}</span>
    </footer>
  </section>;
}
