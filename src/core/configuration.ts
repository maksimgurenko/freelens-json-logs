import { BUILTIN_PROFILE_ID, settingsProblem, type ProfileSettings, type Profile } from './profiles.ts';

export const CONFIG_NAME = 'readable-logs';
export const SCHEMA_VERSION = 2;
export type InspectionLayout = 'inline' | 'side' | 'bottom';
export interface Configuration extends ProfileSettings {
  schemaVersion: 2;
  viewer: { inspection: InspectionLayout };
}
export function defaultConfiguration(): Configuration {
  return { schemaVersion: SCHEMA_VERSION, viewer: { inspection: 'side' }, profiles: [], globalDefault: BUILTIN_PROFILE_ID };
}
/** Conf supplies its own migration metadata even for a newly created file. */
export function configurationData(stored: Record<string, unknown>): Record<string, unknown> {
  const { __internal__: _hostMetadata, ...data } = stored;
  if (!Object.keys(data).length) return defaultConfiguration() as unknown as Record<string, unknown>;
  // Schema 1 held only Inspection. Migrate this known valid format explicitly;
  // invalid and future configurations stay untouched and inhibit writes.
  if (data.schemaVersion === 1 && data.viewer && typeof data.viewer === 'object' &&
    isInspectionLayout((data.viewer as { inspection?: unknown }).inspection)) {
    return { ...data, schemaVersion: SCHEMA_VERSION, profiles: [], globalDefault: BUILTIN_PROFILE_ID };
  }
  return data;
}
export function isInspectionLayout(value: unknown): value is InspectionLayout {
  return value === 'inline' || value === 'side' || value === 'bottom';
}
export function configurationProblem(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return 'The saved configuration is not an object.';
  const data = value as Partial<Configuration>;
  if (data.schemaVersion !== SCHEMA_VERSION) return `Unsupported configuration schema ${String(data.schemaVersion)}. This version supports schema ${SCHEMA_VERSION}.`;
  if (!isInspectionLayout(data.viewer?.inspection)) return 'The saved Inspection preference is invalid.';
  return settingsProblem(data);
}
export interface ViewerPreferences {
  read(): { inspection: InspectionLayout; configuration: Configuration; problem?: string };
  subscribe(changed: () => void): () => void;
  setInspection(layout: InspectionLayout): void;
  saveProfile(profile: Profile): void;
  deleteProfile(id: string): void;
  setGlobalDefault(id: string): void;
}
