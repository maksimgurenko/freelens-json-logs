(async () => {
  const h = global.__rl18;
  const original = h.fs.readFileSync(h.settingsPath), beforeBackups = h.backups();
  const before = h.store.toJSON();
  h.assert(h.store.read().problem, 'Missing fallback error');
  h.assert(h.store.read().configuration.profiles.length === 0 && h.store.read().configuration.globalDefault === 'default', 'Stale profiles/default retained');
  h.assert(h.root().querySelector('[aria-label="Inspection"]').value === 'side', 'Fallback layout is not Side');
  h.assert(h.root().querySelector('[aria-label="Inspection"]').disabled, 'Preference editing not inhibited');
  const problem = h.store.problem;
  h.store.setInspection('bottom'); h.store.setGlobalDefault('unwanted'); h.store.deleteProfile('unwanted'); h.store.moveProfile('unwanted', -1);
  let rejected = false; try { h.store.saveProfile({ id: 'unwanted' }); } catch { rejected = true; }
  h.assert(rejected, 'Incidental Save accepted');
  h.store.fromStore({ schemaVersion: 3, viewer: { inspection: 'bottom' }, profiles: [], globalDefault: 'default' });
  h.assert(h.store.toJSON() === before && h.store.problem === problem, 'Synchronization escaped fallback');
  await h.click('Profiles'); h.assert(h.button('Duplicate').disabled && h.root().querySelector('[aria-label="Global default"]').disabled, 'Profile writes enabled');
  await h.click('Close profiles');
  await h.click('Reset settings…');
  h.assert(h.root().querySelector('[aria-label="Confirm settings reset"]'), 'Confirmation missing');
  h.assert(document.activeElement === h.button('Cancel reset'), 'Cancellation does not receive keyboard focus');
  await h.click('Cancel reset');
  await new Promise(resolve => setTimeout(resolve, 1200));
  h.assert(h.fs.readFileSync(h.settingsPath).equals(original), 'Original bytes overwritten');
  h.assert(JSON.stringify(h.backups()) === JSON.stringify(beforeBackups), 'Cancellation created backup');
  return { problem, originalSha256: require('crypto').createHash('sha256').update(original).digest('hex'),
    preservedAfterStartupAndIncidentalWrites: true, canceledWithoutBackup: true, saved: h.store.read(), text: h.root().innerText };
})()
