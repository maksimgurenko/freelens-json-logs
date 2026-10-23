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
export interface MatchConditions { namespace?: string; container?: string; labels: { key: string; value: string }[] }
export interface ProfileMatching { enabled: boolean; conditions: MatchConditions }
export interface ProfileContext { namespace: string; container: string; labels: Readonly<Record<string, string>> }
export interface Profile { id: string; name: string; format: Formatting; matching: ProfileMatching }
export interface ProfileSettings { profiles: Profile[]; globalDefault: string }
export function defaultMatching(): ProfileMatching { return { enabled: false, conditions: { labels: [] } }; }
export function defaultFormatting(): Formatting {
  return { messagePaths: ['/message', '/msg'], timestampPaths: ['/timestamp', '/time', '/@timestamp'],
    levelPaths: ['/level', '/severity', '/log.level', '/log/level'], inlinePaths: [], hiddenPaths: [],
    numericTimestamp: 'unset', severityMappings: [] };
}
export function builtinProfile(): Profile {
  return { id: BUILTIN_PROFILE_ID, name: 'Default', format: defaultFormatting(), matching: defaultMatching() };
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
  const errors = [...formattingProblems(profile.format), ...matchingProblems(profile.matching)];
  if (typeof profile.id !== 'string' || !profile.id || profile.id === BUILTIN_PROFILE_ID) errors.push('The built-in Default profile is read-only.');
  if (typeof profile.name !== 'string' || !profile.name.trim()) errors.push('Enter a nonempty profile name.');
  else if (profile.name.trim().toLowerCase() === 'default') errors.push('Default is reserved for the built-in profile.');
  else if (profiles.some(other => other.id !== profile.id && other.name.trim().toLowerCase() === profile.name.trim().toLowerCase())) errors.push('Choose a unique profile name.');
  return errors;
}
/** Copies own configuration; a duplicate never inherits subsequent edits. */
export function duplicateProfile(source: Profile, id: string, name: string): Profile {
  return { id, name, format: structuredClone(source.format), matching: structuredClone(source.matching) };
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
export function matchingProblems(value: unknown): string[] {
  if (!value || typeof value !== 'object') return ['Profile matching settings must be an object.'];
  const matching = value as ProfileMatching;
  if (typeof matching.enabled !== 'boolean') return ['Choose whether this profile is enabled for matching.'];
  if (!matching.conditions || typeof matching.conditions !== 'object') return ['Match conditions must be an object.'];
  const conditions = matching.conditions;
  if (Object.keys(matching).some(key => !['enabled', 'conditions'].includes(key)) ||
    Object.keys(conditions).some(key => !['namespace', 'container', 'labels'].includes(key))) return ['Only exact namespace, container name and Pod labels are supported for matching.'];
  for (const key of ['namespace', 'container'] as const) {
    if (conditions[key] !== undefined && (typeof conditions[key] !== 'string' || !conditions[key])) return [`Enter an exact ${key}, or omit its condition.`];
  }
  if (!Array.isArray(conditions.labels) || conditions.labels.some(label => !label || typeof label.key !== 'string' || !label.key || typeof label.value !== 'string' ||
    Object.keys(label).some(key => !['key', 'value'].includes(key)))) return ['Each Pod-label condition needs a nonempty key and an exact text value (which may be empty).'];
  if (new Set(conditions.labels.map(label => label.key)).size !== conditions.labels.length) return ['Use each Pod-label key only once.'];
  return [];
}
/** No conditions means no automatic match. All comparisons are literal and case-sensitive. */
export function profileMatches(profile: Profile, context: ProfileContext): boolean {
  const { enabled, conditions } = profile.matching;
  return enabled && (conditions.namespace !== undefined || conditions.container !== undefined || conditions.labels.length > 0) &&
    (conditions.namespace === undefined || conditions.namespace === context.namespace) &&
    (conditions.container === undefined || conditions.container === context.container) &&
    conditions.labels.every(({ key, value }) => Object.hasOwn(context.labels, key) && context.labels[key] === value);
}
/** Array order is the saved matching order; manual/default never rearrange it. */
export function moveProfile(settings: ProfileSettings, id: string, direction: 1 | -1): ProfileSettings {
  const index = settings.profiles.findIndex(profile => profile.id === id), next = index + direction;
  if (index < 0 || next < 0 || next >= settings.profiles.length) return settings;
  const profiles = [...settings.profiles];
  [profiles[index], profiles[next]] = [profiles[next], profiles[index]];
  return { ...settings, profiles };
}
export function activeProfile(settings: ProfileSettings, manual?: string, context?: ProfileContext): Profile {
  const profiles = [builtinProfile(), ...settings.profiles];
  return profiles.find(profile => profile.id === manual) ??
    (context && settings.profiles.find(profile => profileMatches(profile, context))) ??
    profiles.find(profile => profile.id === settings.globalDefault) ?? builtinProfile();
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
