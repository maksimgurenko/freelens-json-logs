/** Saved profile rules and editing operations, independent of Freelens and log IO. */
export const BUILTIN_PROFILE_ID = 'default';
export const LEVELS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'] as const;
export type CanonicalLevel = typeof LEVELS[number];
export interface SeverityMapping { source: string | number; target: CanonicalLevel }
export interface Formatting {
  messagePaths: string[];
  timestampPaths: string[];
  levelPaths: string[];
  inlinePaths: string[];
  hiddenPaths: string[];
  numericTimestamp: 'unset' | 'seconds' | 'milliseconds';
  severityMappings: SeverityMapping[];
}
export interface Profile { id: string; name: string; format: Formatting }
export interface ProfileSettings { profiles: Profile[]; globalDefault: string }
export function defaultFormatting(): Formatting {
  return { messagePaths: ['/message', '/msg'], timestampPaths: ['/timestamp', '/time', '/@timestamp'],
    levelPaths: ['/level', '/severity', '/log.level', '/log/level'], inlinePaths: [], hiddenPaths: [],
    numericTimestamp: 'unset', severityMappings: [] };
}
export function builtinProfile(): Profile {
  return { id: BUILTIN_PROFILE_ID, name: 'Default', format: defaultFormatting() };
}
export function decodePath(path: string): string[] {
  if (!path.startsWith('/') || /~(?![01])/u.test(path)) throw new Error(`Invalid field path ${JSON.stringify(path)}. Start with / and escape ~ as ~0 and / within a key as ~1.`);
  return path.slice(1).split('/').map(segment => segment.replace(/~1/g, '/').replace(/~0/g, '~'));
}
export function formattingProblems(value: unknown): string[] {
  if (!value || typeof value !== 'object') return ['Formatting rules must be an object.'];
  const data = value as Formatting;
  const errors: string[] = [];
  for (const [key, label] of [['messagePaths', 'Message'], ['timestampPaths', 'Application timestamp'], ['levelPaths', 'Level'],
    ['inlinePaths', 'Inline fields'], ['hiddenPaths', 'Hidden fields']] as const) {
    if (!Array.isArray(data[key])) { errors.push(`${label} paths must be a list.`); continue; }
    for (const path of data[key]) {
      if (typeof path !== 'string') { errors.push(`${label} paths must be text.`); continue; }
      try { decodePath(path); } catch (error) { errors.push(`${label}: ${(error as Error).message}`); }
    }
  }
  if (!['unset', 'seconds', 'milliseconds'].includes(data.numericTimestamp)) errors.push('Choose unset, seconds or milliseconds for numeric timestamps.');
  if (!Array.isArray(data.severityMappings)) errors.push('Severity mappings must be a list.');
  else {
    const sources = new Set<string>();
    for (const mapping of data.severityMappings) {
      if (!mapping || (typeof mapping.source !== 'string' && typeof mapping.source !== 'number') ||
        (typeof mapping.source === 'string' ? !mapping.source.trim() : !Number.isFinite(mapping.source))) {
        errors.push('Each severity mapping needs a nonempty text or finite numeric source.'); continue;
      }
      const key = typeof mapping.source === 'number' ? `number:${mapping.source}` : `text:${mapping.source.toLowerCase()}`;
      if (sources.has(key)) errors.push(`Duplicate severity source ${JSON.stringify(mapping.source)} (${typeof mapping.source}).`);
      sources.add(key);
      if (!LEVELS.includes(mapping.target)) errors.push('Severity targets must be TRACE, DEBUG, INFO, WARN, ERROR or FATAL.');
    }
  }
  return errors;
}
export function profileProblems(profile: Profile, profiles: readonly Profile[]): string[] {
  const errors = formattingProblems(profile.format);
  if (typeof profile.id !== 'string' || !profile.id || profile.id === BUILTIN_PROFILE_ID) errors.push('The built-in Default profile is read-only.');
  if (typeof profile.name !== 'string' || !profile.name.trim()) errors.push('Enter a nonempty profile name.');
  else if (profile.name.trim().toLowerCase() === 'default') errors.push('Default is reserved for the built-in profile.');
  else if (profiles.some(other => other.id !== profile.id && other.name.trim().toLowerCase() === profile.name.trim().toLowerCase())) errors.push('Choose a unique profile name.');
  return errors;
}
/** Copies own configuration; a duplicate never inherits subsequent edits. */
export function duplicateProfile(source: Profile, id: string, name: string): Profile {
  return { id, name, format: structuredClone(source.format) };
}
export function saveProfile(settings: ProfileSettings, draft: Profile): ProfileSettings {
  const errors = profileProblems(draft, settings.profiles);
  if (errors.length) throw new Error(errors.join('\n'));
  const profile = structuredClone({ ...draft, name: draft.name.trim() });
  const exists = settings.profiles.some(value => value.id === draft.id);
  return { ...settings, profiles: exists ? settings.profiles.map(value => value.id === draft.id ? profile : value) : [...settings.profiles, profile] };
}
export function deleteProfile(settings: ProfileSettings, id: string): ProfileSettings {
  return { profiles: settings.profiles.filter(profile => profile.id !== id),
    globalDefault: settings.globalDefault === id ? BUILTIN_PROFILE_ID : settings.globalDefault };
}
export function activeProfile(settings: ProfileSettings, manual?: string): Profile {
  const profiles = [builtinProfile(), ...settings.profiles];
  return profiles.find(profile => profile.id === manual) ?? profiles.find(profile => profile.id === settings.globalDefault) ?? builtinProfile();
}
export function settingsProblem(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return 'Saved profile settings must be an object.';
  const settings = value as ProfileSettings;
  if (!Array.isArray(settings.profiles)) return 'Saved profiles must be a list.';
  const ids = new Set<string>();
  for (const profile of settings.profiles) {
    if (!profile || typeof profile !== 'object') return 'A saved profile is invalid.';
    if (ids.has(profile.id)) return 'Saved profile identities must be unique.';
    ids.add(profile.id);
    const problems = profileProblems(profile, settings.profiles.filter(other => !!other && typeof other === 'object' && typeof other.name === 'string'));
    if (problems.length) return problems[0];
  }
  if (settings.globalDefault !== BUILTIN_PROFILE_ID && !ids.has(settings.globalDefault)) return 'The global default refers to an unknown profile.';
}
