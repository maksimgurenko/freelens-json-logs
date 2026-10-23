(async () => {
  const h = global.__rl18, diskBefore = h.config(), current = h.store.read();
  h.assert(!current.problem && current.configuration.schemaVersion === 3, 'Explicit migration failed');
  h.assert(current.inspection === diskBefore.viewer.inspection, 'Inspection migration lost value');
  if (diskBefore.schemaVersion === 2) {
    h.assert(current.configuration.profiles.length === 2, 'Schema 2 profiles lost');
    h.assert(current.configuration.globalDefault === diskBefore.globalDefault, 'Global reference lost');
    h.assert(JSON.stringify(current.configuration.profiles.map(p => p.id)) === JSON.stringify(diskBefore.profiles.map(p => p.id)), 'Identity/order lost');
    for (let i = 0; i < 2; i++) {
      h.assert(JSON.stringify(current.configuration.profiles[i].format) === JSON.stringify(diskBefore.profiles[i].format), 'Formatting rules lost');
      h.assert(!current.configuration.profiles[i].matching.enabled && current.configuration.profiles[i].matching.conditions.labels.length === 0, 'Schema 2 unexpectedly matches');
    }
  } else h.assert(diskBefore.schemaVersion === 1 && current.configuration.profiles.length === 0 && current.configuration.globalDefault === 'default', 'Schema 1 migration wrong');
  const beforeBackups = h.backups();
  await h.input('Inspection', current.inspection === 'inline' ? 'bottom' : 'inline');
  const diskAfter = await h.waitConfig(data => data.schemaVersion === 3);
  h.assert(JSON.stringify(diskAfter.profiles) === JSON.stringify(current.configuration.profiles), 'Migrated Save lost profiles');
  h.assert(JSON.stringify(h.backups()) === JSON.stringify(beforeBackups), 'Migration made reset backup');
  return { diskBefore, migrated: current, diskAfter, text: h.root().innerText };
})()
