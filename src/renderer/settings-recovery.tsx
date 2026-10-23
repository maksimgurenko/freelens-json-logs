import React, { useEffect, useRef, useState } from 'react';
import type { ViewerPreferences } from '../core/configuration.ts';

/** Recovery stays beside the problem, leaving logs and inspection available. */
export function SettingsRecovery({ preferences, saved }: { preferences: ViewerPreferences; saved: ReturnType<ViewerPreferences['read']> }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const resetButton = useRef<HTMLButtonElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (confirming) cancelButton.current?.focus(); }, [confirming]);
  const reset = async () => {
    if (busy.current) return;
    busy.current = true; setPending(true); setError('');
    try {
      const result = await preferences.resetSettings(true);
      if (result.error) setError(result.error);
      else setConfirming(false);
    } catch (error) { setError(`Unable to reset settings: ${String(error)}`); }
    finally { busy.current = false; setPending(false); }
  };
  if (!saved.problem) return saved.backup ? <p className="rl-notice" role="status">Settings reset. Normal saving is available. Original settings backup: {saved.backup}</p> : null;
  return <section className="rl-notice rl-error rl-recovery" aria-label="Settings recovery">
    <p role="alert">{saved.problem} Using built-in Default and Side inspection. Saved settings are preserved; saving is unavailable.</p>
    <p>Settings: {saved.settingsPath}</p>
    {!confirming ? <button ref={resetButton} type="button" onClick={() => { setError(''); setConfirming(true); }}>Reset settings…</button> :
      <div role="group" aria-label="Confirm settings reset" aria-busy={pending}>
        <p>Reset all saved profiles, matching order, global default and Inspection? An exact backup must be preserved before these settings are replaced with built-in defaults.</p>
        <div className="rl-editor-actions">
          <button type="button" disabled={pending} onClick={() => { void reset(); }}>{pending ? 'Backing up and resetting…' : 'Back up and reset'}</button>
          <button ref={cancelButton} type="button" disabled={pending} onClick={() => { setConfirming(false); setError(''); requestAnimationFrame(() => resetButton.current?.focus()); }}>Cancel reset</button>
        </div>
      </div>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
