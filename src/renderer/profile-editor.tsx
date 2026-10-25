import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { builtinProfile, BUILTIN_PROFILE_ID, duplicateProfile, LEVELS, profileProblems,
  type Formatting, type Profile, type SeverityMapping } from '../core/profiles.ts';
import type { ViewerPreferences } from '../core/configuration.ts';
import { displayTimestamp, parseTransportLine, recordFormatter } from '../core/records.ts';
import type { LocalDismissal } from './local-dismissal.ts';

/** Staged local state lives only while this panel is mounted. No log IO or storage of samples. */
export function ProfileEditor({ preferences, onClose, dismissal }: { preferences: ViewerPreferences; onClose: () => void; dismissal: LocalDismissal }) {
  const [saved, setSaved] = useState(() => preferences.read());
  const [selected, setSelected] = useState(BUILTIN_PROFILE_ID);
  const [draft, setDraft] = useState<Profile>();
  const [sample, setSample] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const deleteButton = useRef<HTMLButtonElement>(null);
  const keepButton = useRef<HTMLButtonElement>(null);
  const cancelDelete = () => { setConfirmDelete(false); deleteButton.current?.focus({ preventScroll: true }); };
  useLayoutEffect(() => dismissal.add(100, () => confirmDelete ? cancelDelete : undefined), [dismissal, confirmDelete]);
  useEffect(() => { if (confirmDelete) keepButton.current?.focus(); }, [confirmDelete]);
  useEffect(() => {
    heading.current?.focus();
    return preferences.subscribe(() => setSaved(preferences.read()));
  }, [preferences]);
  const profiles = [builtinProfile(), ...saved.configuration.profiles];
  const profile = profiles.find(profile => profile.id === selected) ?? profiles[0];
  const current = draft ?? profile;
  const errors = draft ? profileProblems(draft, saved.configuration.profiles) : [];
  const preview = useMemo(() => {
    if (errors.length || !sample) return [];
    const format = recordFormatter(current.format);
    const lines = sample.split('\n');
    if (lines.at(-1) === '') lines.pop();
    return lines.slice(0, 20).map(line => format(parseTransportLine(line)));
  }, [current.format, sample, errors.join('\n')]);
  const update = (change: Partial<Formatting>) => setDraft(previous => previous && ({ ...previous, format: { ...previous.format, ...change } }));
  const duplicate = () => {
    let name = `${profile.name} copy`, n = 2;
    while (profiles.some(profile => profile.name.toLowerCase() === name.toLowerCase())) name = `${profile.name} copy ${n++}`;
    setDraft(duplicateProfile(profile, globalThis.crypto.randomUUID(), name));
    setNotice(''); setConfirmDelete(false);
  };
  const save = () => {
    if (!draft || errors.length) return;
    try {
      preferences.saveProfile(draft); setSelected(draft.id); setDraft(undefined); setNotice('Profile saved. Retained logs use the saved rules.');
    } catch (error) { setNotice(`Unable to save: ${String(error)}`); }
  };
  return <section className="rl-profile-editor" aria-label="Formatting profiles">
    <header className="rl-editor-head"><h2 ref={heading} tabIndex={-1}>Formatting profiles</h2>
      <button type="button" onClick={onClose}>Back to logs</button></header>
    <p className="rl-editor-help">Edit a draft and preview sample logs. Save applies valid rules to retained records. Samples and unfinished edits are temporary.</p>
    {saved.problem && <p className="rl-notice rl-error" role="alert">{saved.problem} Saved settings are preserved; profile changes are unavailable.</p>}
    <div className="rl-profile-management">
      <label>Saved profile <select aria-label="Saved profile" value={profile.id} disabled={!!draft}
        onChange={event => { setSelected(event.target.value); setNotice(''); setConfirmDelete(false); }}>
        {profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
      </select></label>
      <button type="button" disabled={!!draft || !!saved.problem} onClick={duplicate}>Duplicate</button>
      <button type="button" disabled={!!draft || !!saved.problem || profile.id === BUILTIN_PROFILE_ID}
        onClick={() => { setDraft(structuredClone(profile)); setNotice(''); setConfirmDelete(false); }}>Edit</button>
      <button ref={deleteButton} type="button" disabled={!!draft || !!saved.problem || profile.id === BUILTIN_PROFILE_ID}
        onClick={() => setConfirmDelete(true)}>Delete</button>
      <label>Global default <select aria-label="Global default" value={saved.configuration.globalDefault} disabled={!!draft || !!saved.problem}
        onChange={event => preferences.setGlobalDefault(event.target.value)}>
        {profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
      </select></label>
    </div>
    {confirmDelete && <div className="rl-notice" role="alert">Delete {profile.name}? Affected manual selections return to Auto; a deleted global default returns to Default.
      <div className="rl-editor-actions"><button type="button" onClick={() => { preferences.deleteProfile(profile.id); setSelected(BUILTIN_PROFILE_ID); setConfirmDelete(false); setNotice('Profile deleted.'); heading.current?.focus({ preventScroll: true }); }}>Confirm delete</button>
        <button ref={keepButton} type="button" onClick={cancelDelete}>Keep profile</button></div></div>}
    <section className="rl-matching-order" aria-label="Matching order">
      <h3>Matching order</h3>
      <p className="rl-editor-help">Auto uses the first enabled profile whose conditions all match, then the global default. Manual selection takes priority. Moving a profile saves its order immediately.</p>
      {!saved.configuration.profiles.length ? <p className="rl-editor-help">Duplicate a profile to add matching rules. Default remains available as the fallback.</p> :
        <ol>{saved.configuration.profiles.map((item, index) => <li key={item.id}>
          <span className="rl-order-name">{item.name}</span>
          <span className="rl-editor-help">{!item.matching.enabled ? 'Matching disabled' : !item.matching.conditions.namespace && !item.matching.conditions.container && !item.matching.conditions.labels.length ? 'No conditions · never matches' : 'Matching enabled'}</span>
          <button type="button" aria-label={`Move ${item.name} up`} disabled={!!draft || !!saved.problem || index === 0}
            onClick={() => preferences.moveProfile(item.id, -1)}>Move up</button>
          <button type="button" aria-label={`Move ${item.name} down`} disabled={!!draft || !!saved.problem || index === saved.configuration.profiles.length - 1}
            onClick={() => preferences.moveProfile(item.id, 1)}>Move down</button>
        </li>)}</ol>}
    </section>
    <div className="rl-editor-columns">
      <div className="rl-editor-fields">
        <label>Profile name <input aria-label="Profile name" value={current.name} disabled={!draft}
          onChange={event => setDraft(previous => previous && ({ ...previous, name: event.target.value }))} /></label>
        {!draft && <p className="rl-editor-help">{profile.id === BUILTIN_PROFILE_ID ? 'Default is read-only. Duplicate it to create independent rules.' : 'Choose Edit to change or rename this profile.'}</p>}
        <fieldset className="rl-matching"><legend>Automatic matching</legend>
          <p className="rl-editor-help">Every condition must match exactly, including case. Empty namespace or container means no restriction. No conditions means no automatic match. Disabling matching keeps manual and global-default choices available.</p>
          <label><input type="checkbox" aria-label="Enabled for matching" checked={current.matching.enabled} disabled={!draft}
            onChange={event => { const enabled = event.target.checked; setDraft(previous => previous && ({ ...previous, matching: { ...previous.matching, enabled } })); }} />Enabled for matching</label>
          {([['namespace', 'Match namespace'], ['container', 'Match container name']] as const).map(([key, label]) =>
            <label key={key}>{label}<input aria-label={label} value={current.matching.conditions[key] ?? ''} disabled={!draft}
              onChange={event => { const value = event.target.value; setDraft(previous => previous && ({ ...previous,
                matching: { ...previous.matching, conditions: { ...previous.matching.conditions, [key]: value || undefined } } })); }} /></label>)}
          <p className="rl-editor-help">Pod labels: all key/value pairs are required. An empty value matches only an explicitly empty label.</p>
          {current.matching.conditions.labels.map((condition, index) => <div className="rl-label-condition" key={index}>
            {(['key', 'value'] as const).map(key => <label key={key}>Label {key}<input aria-label={`Match label ${index + 1} ${key}`} value={condition[key]} disabled={!draft}
              onChange={event => { const value = event.target.value; setDraft(previous => previous && ({ ...previous, matching: { ...previous.matching,
                conditions: { ...previous.matching.conditions, labels: previous.matching.conditions.labels.map((item, i) => i === index ? { ...item, [key]: value } : item) } } })); }} /></label>)}
            <button type="button" aria-label={`Remove label condition ${index + 1}`} disabled={!draft} onClick={() => setDraft(previous => previous && ({ ...previous,
              matching: { ...previous.matching, conditions: { ...previous.matching.conditions, labels: previous.matching.conditions.labels.filter((_, i) => i !== index) } } }))}>Remove</button>
          </div>)}
          <button type="button" disabled={!draft} onClick={() => setDraft(previous => previous && ({ ...previous,
            matching: { ...previous.matching, conditions: { ...previous.matching.conditions, labels: [...previous.matching.conditions.labels, { key: '', value: '' }] } } }))}>Add label condition</button>
        </fieldset>
        <p className="rl-editor-help">One exact slash path per line, in priority order. Use /log.level for a literal dot, /items/0/code for an array, ~1 for a slash and ~0 for a tilde in a key. Missing paths fall through; defaults are not appended.</p>
        {([['messagePaths', 'Message paths', 'Empty uses unchanged application text.'], ['timestampPaths', 'Application timestamp paths', 'Empty uses the Kubernetes timestamp.'],
          ['levelPaths', 'Level paths', 'Empty extracts no level.'], ['inlinePaths', 'Inline fields', 'Additional fields in display order. Extracted leaves are omitted.'],
          ['hiddenPaths', 'Hidden fields', 'Takes precedence over inline fields, including nested children. Originals and extracted roles stay available.']] as const).map(([key, label, hint]) =>
          <label className="rl-path-field" key={key}>{label}<textarea aria-label={label} rows={2} disabled={!draft} value={current.format[key].join('\n')}
            onChange={event => update({ [key]: event.target.value === '' ? [] : event.target.value.split('\n') })} /><span>{hint}</span></label>)}
        <label>Numeric timestamps <select aria-label="Numeric timestamps" value={current.format.numericTimestamp} disabled={!draft}
          onChange={event => update({ numericTimestamp: event.target.value as Formatting['numericTimestamp'] })}>
          <option value="unset">Unset (use Kubernetes time)</option><option value="seconds">Seconds</option><option value="milliseconds">Milliseconds</option>
        </select></label>
        <fieldset className="rl-mapping"><legend>Severity mappings</legend>
          <p className="rl-editor-help">Explicit mappings win over built-in levels. Text sources ignore case; numbers and text are distinct.</p>
          {current.format.severityMappings.map((mapping, index) => {
            const change = (value: SeverityMapping) => update({ severityMappings: current.format.severityMappings.map((item, i) => i === index ? value : item) });
            return <div className="rl-mapping-row" key={index}>
              <select aria-label={`Mapping ${index + 1} source type`} disabled={!draft} value={typeof mapping.source}
                onChange={event => change({ ...mapping, source: event.target.value === 'number' ? Number(mapping.source) : String(mapping.source) })}>
                <option value="string">Text</option><option value="number">Number</option></select>
              <input aria-label={`Mapping ${index + 1} source`} type={typeof mapping.source === 'number' ? 'number' : 'text'} step="any" disabled={!draft}
                value={typeof mapping.source === 'number' && !Number.isFinite(mapping.source) ? '' : mapping.source}
                onChange={event => change({ ...mapping, source: typeof mapping.source === 'number' ? event.target.value === '' ? NaN : Number(event.target.value) : event.target.value })} />
              <select aria-label={`Mapping ${index + 1} target`} disabled={!draft} value={mapping.target}
                onChange={event => change({ ...mapping, target: event.target.value as SeverityMapping['target'] })}>
                {LEVELS.map(level => <option key={level}>{level}</option>)}</select>
              <button type="button" disabled={!draft} aria-label={`Remove mapping ${index + 1}`} onClick={() => update({ severityMappings: current.format.severityMappings.filter((_, i) => i !== index) })}>Remove</button>
            </div>;
          })}
          <button type="button" disabled={!draft} onClick={() => update({ severityMappings: [...current.format.severityMappings, { source: '', target: 'INFO' }] })}>Add mapping</button>
        </fieldset>
      </div>
      <div className="rl-editor-preview">
        <label className="rl-path-field">Sample logs <textarea aria-label="Sample logs" rows={7} value={sample}
          placeholder={'Paste application text or timestamped lines here'} onChange={event => setSample(event.target.value)} /></label>
        <h3>Preview</h3>
        {errors.length ? <p className="rl-editor-help">Fix the draft errors to preview these rules.</p> : !sample ? <p className="rl-editor-help">Paste sample logs to preview extraction and inline fields. Up to 20 lines are shown.</p> :
          <div className="rl-preview-records" aria-label="Profile preview">{preview.map((record, index) => <div className="rl-preview-record" key={index}>
            <time>{displayTimestamp(record.timestamp)}</time> <strong>{record.level}</strong><pre>{record.message || '\u00a0'}</pre>
            {record.inlineFields?.map(field => <pre key={field.path}>{field.path} = {JSON.stringify(field.value)}</pre>)}
          </div>)}</div>}
      </div>
    </div>
    <footer className="rl-editor-save">
      {!!errors.length && <ul role="alert">{errors.map((error, i) => <li key={i}>{error}</li>)}</ul>}
      {notice && <p role="status">{notice}</p>}
      {draft && <div className="rl-editor-actions"><button type="button" disabled={!!errors.length || !!saved.problem} onClick={save}>Save profile</button>
        <button type="button" onClick={() => { setDraft(undefined); setNotice('Draft discarded. Saved rules are unchanged.'); heading.current?.focus({ preventScroll: true }); }}>Cancel draft</button></div>}
    </footer>
  </section>;
}
