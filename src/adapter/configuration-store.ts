import { Common } from '@freelensapp/extensions';
import { action, makeObservable, observable, reaction } from 'mobx';
import { CONFIG_NAME, configurationData, configurationProblem, defaultConfiguration, isInspectionLayout,
  type Configuration, type InspectionLayout, type ViewerPreferences } from '../core/configuration.ts';

/** Identical schema/store name in both processes; only main persists SDK updates. */
export class ConfigurationStore extends Common.Store.ExtensionStore<Record<string, unknown>> implements ViewerPreferences {
  data: Record<string, unknown> = defaultConfiguration() as unknown as Record<string, unknown>;
  problem: string | undefined;
  constructor() {
    super({ configName: CONFIG_NAME, clearInvalidConfig: false, syncOptions: { fireImmediately: false } });
    makeObservable(this, { data: observable.ref, problem: observable, fromStore: action, setInspection: action, failed: action });
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
    return { inspection: this.problem ? 'side' as const : (this.data as unknown as Configuration).viewer.inspection, problem: this.problem };
  }
  subscribe(changed: () => void) { return reaction(() => [this.data, this.problem], changed); }
  setInspection(inspection: InspectionLayout) {
    if (this.problem || !isInspectionLayout(inspection)) return;
    this.data = { ...this.data, viewer: { ...(this.data as unknown as Configuration).viewer, inspection } };
  }
}
export const configurationStore = ConfigurationStore.getInstanceOrCreate<ConfigurationStore>();
