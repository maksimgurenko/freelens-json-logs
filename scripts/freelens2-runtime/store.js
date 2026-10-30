import { Common } from '@freelensapp/extensions';
import * as Mobx from 'mobx';
import { configurationData, configurationProblem, defaultConfiguration } from '../../src/core/configuration.ts';
import { builtinProfile, duplicateProfile, saveProfile } from '../../src/core/profiles.ts';

// Deliberate feasibility adaptation: the shared model has no filesystem import,
// and every activation reattaches the SDK's synchronization.
export class ProbeStore extends Common.Store.ExtensionStore {
  value = Mobx.observable.box(defaultConfiguration(), { deep: false });
  constructor() {
    super({ configName: 'readable-logs', clearInvalidConfig: false,
      syncOptions: { fireImmediately: false } });
  }
  fromStore(data) {
    const next = configurationData(data);
    const problem = configurationProblem(next);
    if (problem) throw Error(problem);
    Mobx.runInAction(() => this.value.set(next));
  }
  toJSON() { return this.value.get(); }
  edit(layout, name) {
    const current = this.toJSON();
    const profile = duplicateProfile(builtinProfile(), 'probe57', name);
    const next = { ...current, ...saveProfile(current, profile), viewer: { inspection: layout } };
    if (configurationProblem(next)) throw Error(configurationProblem(next));
    Mobx.runInAction(() => this.value.set(next));
  }
}
export const store = new ProbeStore();
