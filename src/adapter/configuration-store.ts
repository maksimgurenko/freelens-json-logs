import { Common } from '@freelensapp/extensions';
import { action, makeObservable, observable, reaction } from 'mobx';
import { CONFIG_NAME, configurationData, configurationProblem, defaultConfiguration, isInspectionLayout,
  type Configuration, type InspectionLayout, type ViewerPreferences } from '../core/configuration.ts';
import { builtinProfile, deleteProfile, saveProfile, type Profile } from '../core/profiles.ts';

/** Identical schema/store name in both processes; only main persists SDK updates. */
export class ConfigurationStore extends Common.Store.ExtensionStore<Record<string, unknown>> implements ViewerPreferences {
  data: Record<string, unknown> = defaultConfiguration() as unknown as Record<string, unknown>;
  problem: string | undefined;
  constructor() {
    super({ configName: CONFIG_NAME, clearInvalidConfig: false, syncOptions: { fireImmediately: false } });
    makeObservable(this, { data: observable.ref, problem: observable, fromStore: action, setInspection: action, failed: action,
      saveProfile: action, deleteProfile: action, setGlobalDefault: action });
  }
  fromStore(data: Record<string, unknown>) {
    // An absent first-version file loads as {}. Later schema migrations belong
    // here; never interpret an unknown version as a default configuration.
    this.data = configurationData(data);
    this.problem = configurationProblem(this.data);
  }
  toJSON() { return this.data; }
  failed(error: unknown) { this.problem = `Unable to load Readable logs settings: ${String(error)}`; }
  read() {
    const configuration = this.problem ? defaultConfiguration() : this.data as unknown as Configuration;
    return { inspection: configuration.viewer.inspection, configuration, problem: this.problem };
  }
  subscribe(changed: () => void) { return reaction(() => [this.data, this.problem], changed); }
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
}
export const configurationStore = ConfigurationStore.getInstanceOrCreate<ConfigurationStore>();
