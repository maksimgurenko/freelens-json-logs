(async () => {
  const h = global.__rl18;
  h.assert(h.store.problem.includes('Unable to read') && h.store.problem.includes('EACCES'), 'Not a real unreadable-file error');
  h.assert((h.fs.statSync(h.settingsPath).mode & 0o777) === 0, 'Source is not mode 000');
  const before = h.store.toJSON(), backups = h.backups();
  h.store.setInspection('bottom'); h.store.setGlobalDefault('unwanted');
  h.store.fromStore({ schemaVersion: 3, viewer: { inspection: 'bottom' }, profiles: [], globalDefault: 'default' });
  h.assert(h.store.toJSON() === before, 'Unreadable fallback accepted synchronization');
  await h.click('Reset settings…'); await h.click('Cancel reset');
  h.assert(JSON.stringify(h.backups()) === JSON.stringify(backups), 'Canceled reset changed backups');
  await h.click('Reset settings…'); await h.click('Back up and reset');
  for (let i = 0; i < 100 && !h.root().innerText.includes('Unable to back up and reset'); i++) await h.tick();
  h.assert(h.root().innerText.includes('Unable to back up and reset') && h.root().innerText.includes('EACCES'), 'Unreadable backup failure missing');
  h.assert(h.store.problem && h.root().querySelector('[aria-label="Inspection"]').disabled, 'Unreadable reset escaped fallback');
  h.assert(h.root().querySelectorAll('.rl-row').length === 1, 'Unreadable settings blocked actual logs');
  return { saved: h.store.read(), sourceMode: (h.fs.statSync(h.settingsPath).mode & 0o777).toString(8),
    backupCountUnchanged: h.backups().length === backups.length, text: h.root().innerText };
})()
