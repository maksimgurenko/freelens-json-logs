// PROTOTYPE: a main-process writer is required for ExtensionStore persistence.
const {Main} = global.LensExtensions;
const {store} = require('./store');
exports.default = class HostSpikeMain extends Main.LensExtension {
  onActivate() {
    store.loadExtension(this);
    console.log('[READABLE-LOGS-HOST-SPIKE] main activated', {marker:store.marker});
    this.disposeMarker = global.Mobx.reaction(() => store.marker,
      marker => console.log('[READABLE-LOGS-HOST-SPIKE] main marker', {marker}));
  }
  onDeactivate() {
    this.disposeMarker?.();
    console.log('[READABLE-LOGS-HOST-SPIKE] main deactivated');
  }
};
