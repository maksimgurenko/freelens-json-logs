import { Common } from '@freelensapp/extensions';
import { action, makeObservable, observable, observableRef, reaction } from 'mobx';
import { CONFIG_NAME, configurationData, configurationProblem, defaultConfiguration, isInspectionLayout,
  type Configuration, type InspectionLayout, type ViewerPreferences } from '../core/configuration.ts';
import { builtinProfile, deleteProfile, moveProfile, saveProfile, type Profile } from '../core/profiles.ts';
import type { ResetResult, SettingsMutation, SettingsStatus } from './configuration-ipc.ts';

type HostExtension = Parameters<Common.Store.ExtensionStore['loadExtension']>[0];

/** Renderers receive SDK updates and send mutations to the authoritative main store. */
export class ConfigurationStore extends Common.Store.ExtensionStore<Record<string, unknown>> implements ViewerPreferences {
  data: Record<string, unknown> = defaultConfiguration() as unknown as Record<string, unknown>;
  problem: string | undefined;
  lastBackup: string | undefined;
  settingsPath = '';
  private loading = false;
  private resetAction?: (confirmed: boolean) => Promise<ResetResult>;
  private mutateAction?: (mutation: SettingsMutation) => Promise<void>;
  constructor() {
    super({ configName: CONFIG_NAME, clearInvalidConfig: false, syncOptions: { fireImmediately: false } });
    makeObservable(this, { data: observableRef, problem: observable, lastBackup: observable, settingsPath: observable,
      fromStore: action, setInspection: action, failed: action, attach: action,
      saveProfile: action, deleteProfile: action, setGlobalDefault: action, moveProfile: action });
  }
  resolveSettingsDirectory(extension: HostExtension) {
    // The SDK derives its store directory from the extension manifest.
    this.extension = extension;
    return this.cwd();
  }
  attach(extension: HostExtension, status: SettingsStatus) {
    this.detach();
    this.settingsPath = status.path;
    this.problem = status.problem;
    this.lastBackup = undefined;
    if (this.problem) return;
    this.loading = true;
    try {
      this.loadExtension(extension);
    } catch (error) { this.failed(error); }
    finally {
      this.loading = false;
      // The SDK finishes installing its listeners after its initial fromStore call.
      if (this.problem) this.detach();
    }
    this.lastBackup = status.backup;
  }
  detach() {
    this.persistentStorage?.stopSyncing();
    this.persistentStorage = undefined;
  }
  bindMutation(mutate?: (mutation: SettingsMutation) => Promise<void>) { this.mutateAction = mutate; }
  bindReset(reset?: (confirmed: boolean) => Promise<ResetResult>) { this.resetAction = reset; }
  resetSettings(confirmed: boolean): Promise<ResetResult> {
    if (confirmed !== true) return Promise.resolve({ error: 'Reset canceled. Saved settings were not changed.' });
    return this.resetAction?.(confirmed) ?? Promise.resolve({ error: 'Settings recovery is unavailable. Reopen Freelens and try again.' });
  }
  fromStore(data: Record<string, unknown>) {
    if (this.problem) return;
    const next = data && typeof data === 'object' && !Array.isArray(data) ? configurationData(data) : data;
    const problem = configurationProblem(next);
    // Keep toJSON stable on rejected synchronization; never echo defaults over it.
    if (problem) { this.enterFallback(problem); return; }
    this.data = next;
  }
  toJSON() { return this.data; }
  failed(error: unknown) {
    this.enterFallback(`Unable to load Readable logs settings: ${String(error)}`);
  }
  private enterFallback(problem: string) {
    if (!this.loading) this.detach();
    this.problem = problem;
    this.lastBackup = undefined;
  }
  read() {
    const configuration = this.problem ? defaultConfiguration() : this.data as unknown as Configuration;
    return { inspection: configuration.viewer.inspection, configuration, problem: this.problem, settingsPath: this.settingsPath, backup: this.lastBackup };
  }
  subscribe(changed: () => void) { return reaction(() => [this.data, this.problem, this.settingsPath, this.lastBackup], changed); }
  setInspection(inspection: InspectionLayout) {
    if (this.problem || !isInspectionLayout(inspection)) return;
    if (this.mutateAction) return this.mutateAction({ type: 'inspection', layout: inspection });
    this.data = { ...this.data, viewer: { ...(this.data as unknown as Configuration).viewer, inspection } };
  }
  saveProfile(profile: Profile) {
    if (this.problem) throw new Error(this.problem);
    if (this.mutateAction) return this.mutateAction({ type: 'save-profile', profile });
    this.data = { ...this.data, ...saveProfile(this.read().configuration, profile) };
  }
  deleteProfile(id: string) {
    if (this.problem) return;
    if (this.mutateAction) return this.mutateAction({ type: 'delete-profile', id });
    this.data = { ...this.data, ...deleteProfile(this.read().configuration, id) };
  }
  setGlobalDefault(id: string) {
    if (this.problem) return;
    if (this.mutateAction) return this.mutateAction({ type: 'global-default', id });
    if (![builtinProfile(), ...this.read().configuration.profiles].some(profile => profile.id === id)) return;
    this.data = { ...this.data, globalDefault: id };
  }
  moveProfile(id: string, direction: 1 | -1) {
    if (this.problem) return;
    if (this.mutateAction) return this.mutateAction({ type: 'move-profile', id, direction });
    this.data = { ...this.data, ...moveProfile(this.read().configuration, id, direction) };
  }
}
export function getConfigurationStore() {
  return ConfigurationStore.getInstanceOrCreate<ConfigurationStore>();
}
