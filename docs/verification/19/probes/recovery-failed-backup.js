(async () => {
  const h = global.__rl18, original = h.fs.readFileSync(h.settingsPath), before = h.backups();
  await h.click('Reset settings…'); await h.click('Back up and reset');
  for (let i = 0; i < 100 && !h.root().innerText.includes('Unable to back up and reset'); i++) await h.tick();
  h.assert(h.root().innerText.includes('Unable to back up and reset'), 'Backup error not reported');
  h.assert(h.store.read().problem && h.root().querySelector('[aria-label="Inspection"]').disabled, 'Failed backup escaped fallback');
  h.assert(h.fs.readFileSync(h.settingsPath).equals(original), 'Failed backup changed original');
  h.assert(JSON.stringify(h.backups()) === JSON.stringify(before), 'Failed backup invented file');
  return { unchanged: true, problem: h.store.read().problem, confirmationStillAvailable: !!h.button('Back up and reset'), text: h.root().innerText };
})()
