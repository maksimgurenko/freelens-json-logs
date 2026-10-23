(() => {
  const h = global.__rl18, saved = h.config();
  h.assert(!h.store.problem && saved.profiles.length === 0 && saved.globalDefault === 'default' && saved.viewer.inspection === 'bottom', 'Original configuration not restored');
  h.assert(h.root().dataset.version === '0.1.18' && h.root().querySelectorAll('.rl-row').length === 1 && h.button('Resume'), 'Final installed viewer not usable and paused');
  const result = { version: h.root().dataset.version, host: global.LensExtensions.Common.Util.getAppVersion(), configuration: saved,
    text: h.root().innerText, loadedEntries: Object.keys(require.cache).filter(key => key.includes('freelens-readable-logs') && /renderer-.*\.js$/.test(key)) };
  delete global.__rl18;
  result.helperRemoved = !global.__rl18;
  return result;
})()
