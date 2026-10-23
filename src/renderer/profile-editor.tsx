import React, { useEffect, useMemo, useRef, useState } from 'react';
import { builtinProfile, BUILTIN_PROFILE_ID, duplicateProfile, LEVELS, profileProblems,
  type Formatting, type Profile, type SeverityMapping } from '../core/profiles.ts';
import type { ViewerPreferences } from '../core/configuration.ts';
import { displayTimestamp, parseTransportLine, recordFormatter } from '../core/records.ts';

/** Staged local state lives only while this panel is mounted. No log IO or storage of samples. */
export function ProfileEditor({ preferences, onClose }: { preferences: ViewerPreferences; onClose: () => void }) {
  const [saved, setSaved] = useState(() => preferences.read());
  const [selected, setSelected] = useState(BUILTIN_PROFILE_ID);
  const [draft, setDraft] = useState<Profile>();
  const [sample, setSample] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
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
      <button type="button" onClick={onClose}>Close profiles</button></header>
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
      <button type="button" disabled={!!draft || !!saved.problem || profile.id === BUILTIN_PROFILE_ID}
        onClick={() => setConfirmDelete(true)}>Delete</button>
      <label>Global default <select aria-label="Global default" value={saved.configuration.globalDefault} disabled={!!draft || !!saved.problem}
        onChange={event => preferences.setGlobalDefault(event.target.value)}>
        {profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
      </select></label>
    </div>
    {confirmDelete && <div className="rl-notice" role="alert">Delete {profile.name}? Affected manual selections return to Auto; a deleted global default returns to Default.
      <div className="rl-editor-actions"><button type="button" onClick={() => { preferences.deleteProfile(profile.id); setSelected(BUILTIN_PROFILE_ID); setConfirmDelete(false); setNotice('Profile deleted.'); }}>Confirm delete</button>
        <button type="button" onClick={() => setConfirmDelete(false)}>Keep profile</button></div></div>}
    <div className="rl-editor-columns">
      <div className="rl-editor-fields">
        <label>Profile name <input aria-label="Profile name" value={current.name} disabled={!draft}
          onChange={event => setDraft(previous => previous && ({ ...previous, name: event.target.value }))} /></label>
        {!draft && <p className="rl-editor-help">{profile.id === BUILTIN_PROFILE_ID ? 'Default is read-only. Duplicate it to create independent rules.' : 'Choose Edit to change or rename this profile.'}</p>}
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
        <button type="button" onClick={() => { setDraft(undefined); setNotice('Draft discarded. Saved rules are unchanged.'); }}>Cancel</button></div>}
    </footer>
  </section>;
}
