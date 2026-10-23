import { Common } from '@freelensapp/extensions';
import { action, makeObservable, observable, reaction } from 'mobx';
import { CONFIG_NAME, configurationData, configurationProblem, defaultConfiguration, isInspectionLayout,
  type Configuration, type InspectionLayout, type ViewerPreferences } from '../core/configuration.ts';
import { builtinProfile, deleteProfile, moveProfile, saveProfile, type Profile } from '../core/profiles.ts';
import { join } from 'node:path';
import { inspectConfiguration, type ResetResult } from './configuration-file.ts';

/** Identical schema/store name in both processes; only main persists SDK updates. */
export class ConfigurationStore extends Common.Store.ExtensionStore<Record<string, unknown>> implements ViewerPreferences {
  data: Record<string, unknown> = defaultConfiguration() as unknown as Record<string, unknown>;
  problem: string | undefined;
  lastBackup: string | undefined;
  settingsPath = '';
  private syncing = false;
  private resetAction?: (confirmed: boolean) => Promise<ResetResult>;
  constructor() {
    super({ configName: CONFIG_NAME, clearInvalidConfig: false, syncOptions: { fireImmediately: false } });
    makeObservable(this, { data: observable.ref, problem: observable, lastBackup: observable, fromStore: action, setInspection: action, failed: action,
      loaded: action, backedUp: action,
      saveProfile: action, deleteProfile: action, setGlobalDefault: action, moveProfile: action });
  }
  loadExtension(extension: Parameters<Common.Store.ExtensionStore['loadExtension']>[0]) {
    this.extension = extension;
    this.settingsPath = join(this.cwd(), `${CONFIG_NAME}.json`);
    const inspected = inspectConfiguration(this.settingsPath);
    this.loaded(inspected.problem);
    // No Conf construction, migration, disk writer or synchronization in fallback.
    if (inspected.problem) return;
    if (this.syncing) { this.fromStore(inspected.data!); return; }
    try { super.loadExtension(extension); this.syncing = true; }
    catch (error) { this.failed(error); }
  }
  loaded(problem?: string) { this.problem = problem; }
  backedUp(path: string) { this.lastBackup = path; }
  bindReset(reset: (confirmed: boolean) => Promise<ResetResult>) { this.resetAction = reset; }
  resetSettings(confirmed: boolean): Promise<ResetResult> {
    if (confirmed !== true) return Promise.resolve({ error: 'Reset canceled. Saved settings were not changed.' });
    return this.resetAction?.(confirmed) ?? Promise.resolve({ error: 'Settings recovery is unavailable. Reopen Freelens and try again.' });
  }
  fromStore(data: Record<string, unknown>) {
    if (this.problem) return;
    const next = data && typeof data === 'object' && !Array.isArray(data) ? configurationData(data) : data;
    const problem = configurationProblem(next);
    // Keep toJSON stable on rejected synchronization; never echo defaults over it.
    if (problem) { this.problem = problem; return; }
    this.data = next;
  }
  toJSON() { return this.data; }
  failed(error: unknown) { this.problem = `Unable to load Readable logs settings: ${String(error)}`; }
  read() {
    const configuration = this.problem ? defaultConfiguration() : this.data as unknown as Configuration;
    return { inspection: configuration.viewer.inspection, configuration, problem: this.problem, settingsPath: this.settingsPath, backup: this.lastBackup };
  }
  subscribe(changed: () => void) { return reaction(() => [this.data, this.problem, this.lastBackup], changed); }
  setInspection(inspection: InspectionLayout) {
    if (this.problem || !isInspectionLayout(inspection)) return;
    this.data = { ...this.data, viewer: { ...(this.data as unknown as Configuration).viewer, inspection } };
  }
  saveProfile(profile: Profile) {
    if (this.problem) throw new Error(this.problem);
    this.data = { ...this.data, ...saveProfile(this.read().configuration, profile) };
  }
  deleteProfile(id: string) {
    if (this.problem) return;
    this.data = { ...this.data, ...deleteProfile(this.read().configuration, id) };
  }
  setGlobalDefault(id: string) {
    if (this.problem || ![builtinProfile(), ...this.read().configuration.profiles].some(profile => profile.id === id)) return;
    this.data = { ...this.data, globalDefault: id };
  }
  moveProfile(id: string, direction: 1 | -1) {
    if (this.problem) return;
    this.data = { ...this.data, ...moveProfile(this.read().configuration, id, direction) };
  }
}
export const configurationStore = ConfigurationStore.getInstanceOrCreate<ConfigurationStore>();
