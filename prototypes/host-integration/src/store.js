// PROTOTYPE: one marker checks the real main/renderer storage lifecycle.
const {Common} = global.LensExtensions;
const {makeObservable, observable, action} = global.Mobx;

class SpikeStore extends Common.Store.ExtensionStore {
  marker = 'unset';
  constructor() {
    super({configName:'host-spike-marker', defaults:{marker:'unset'}});
    makeObservable(this, {marker:observable, fromStore:action, setMarker:action});
  }
  fromStore(value) { this.marker = typeof value.marker === 'string' ? value.marker : 'unset'; }
  setMarker(value) { this.marker = value; }
  toJSON() { return {marker:this.marker}; }
}
exports.store = SpikeStore.getInstanceOrCreate();
