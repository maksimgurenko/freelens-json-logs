export const CONFIG_NAME = 'readable-logs';
export const SCHEMA_VERSION = 1;
export type InspectionLayout = 'inline' | 'side' | 'bottom';
export interface Configuration {
  schemaVersion: 1;
  viewer: { inspection: InspectionLayout };
}
export function defaultConfiguration(): Configuration {
  return { schemaVersion: SCHEMA_VERSION, viewer: { inspection: 'side' } };
}
/** Conf supplies its own migration metadata even for a newly created file. */
export function configurationData(stored: Record<string, unknown>): Record<string, unknown> {
  const { __internal__: _hostMetadata, ...data } = stored;
  return Object.keys(data).length ? data : defaultConfiguration() as unknown as Record<string, unknown>;
}
export function isInspectionLayout(value: unknown): value is InspectionLayout {
  return value === 'inline' || value === 'side' || value === 'bottom';
}
export function configurationProblem(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return 'The saved configuration is not an object.';
  const data = value as Partial<Configuration>;
  if (data.schemaVersion !== SCHEMA_VERSION) return `Unsupported configuration schema ${String(data.schemaVersion)}. This version supports schema ${SCHEMA_VERSION}.`;
  if (!isInspectionLayout(data.viewer?.inspection)) return 'The saved Inspection preference is invalid.';
}
export interface ViewerPreferences {
  read(): { inspection: InspectionLayout; problem?: string };
  subscribe(changed: () => void): () => void;
  setInspection(layout: InspectionLayout): void;
}
