(async () => {
  const h = global.__rl18, original = h.fs.readFileSync(h.settingsPath), before = h.backups();
  if (!h.button('Back up and reset')) await h.click('Reset settings…');
  await h.click('Back up and reset');
  for (let i = 0; i < 100 && h.store.read().problem; i++) await h.tick();
  h.assert(!h.store.read().problem, 'Reset did not restore usable settings: ' + h.root().innerText);
  const files = h.backups().filter(name => !before.includes(name));
  h.assert(files.length === 1, 'Expected one new exclusive backup');
  const backup = h.path.join(h.backupDirectory, files[0]);
  h.assert(h.fs.readFileSync(backup).equals(original), 'Backup differs from original');
  const saved = h.config();
  h.assert(saved.schemaVersion === 3 && saved.profiles.length === 0 && saved.globalDefault === 'default' && saved.viewer.inspection === 'side', 'Stale references survived reset');
  h.assert(h.root().querySelector('[aria-label="Profile"]').value === '', 'Stale manual choice survived reset');
  h.assert(h.root().querySelectorAll('.rl-row').length === 1 && h.button('Resume'), 'Reset lost retained logs or Pause');
  h.assert(!h.root().querySelector('[aria-label="Inspection"]').disabled, 'Normal preference saving still inhibited');
  await h.input('Inspection', 'inline'); await h.waitConfig(data => data.viewer.inspection === 'inline');
  await h.click('Profiles'); await h.click('Duplicate'); await h.input('Profile name', 'After reset'); await h.click('Save profile');
  const fresh = await h.waitConfig(data => data.profiles.some(p => p.name === 'After reset'));
  await h.input('Global default', fresh.profiles[0].id); await h.waitConfig(data => data.globalDefault === fresh.profiles[0].id);
  await h.click('Close profiles');
  return { exactBackup: backup, originalSha256: require('crypto').createHash('sha256').update(original).digest('hex'),
    configurationImmediatelyAfterReset: saved, normalSavingRestored: h.config(), paused: !!h.button('Resume'), text: h.root().innerText };
})()
