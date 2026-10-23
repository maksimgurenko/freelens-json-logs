(async () => {
  const h = global.__rl18;
  await h.click('Profiles'); await h.click('Duplicate');
  await h.input('Profile name', 'Recovery one'); await h.input('Message paths', '');
  await h.input('Inline fields', '/sequence'); await h.click('Save profile');
  const one = (await h.waitConfig(data => data.profiles.some(p => p.name === 'Recovery one'))).profiles.find(p => p.name === 'Recovery one');
  await h.click('Duplicate'); await h.input('Profile name', 'Recovery two');
  const enabled = h.root().querySelector('[aria-label="Enabled for matching"]'); enabled.click(); await h.tick();
  await h.input('Match namespace', 'readable-logs-spike'); await h.input('Match container name', 'json');
  await h.click('Save profile');
  const two = (await h.waitConfig(data => data.profiles.length === 2)).profiles.find(p => p.name === 'Recovery two');
  await h.input('Global default', one.id);
  h.root().querySelector('button[aria-label="Move Recovery two up"]').click(); await h.tick();
  await h.click('Close profiles'); await h.input('Inspection', 'bottom'); await h.input('Profile', one.id);
  const saved = await h.waitConfig(data => data.globalDefault === one.id && data.profiles[0].id === two.id && data.viewer.inspection === 'bottom');
  return { configuration: saved, displayed: h.store.read(), manual: h.root().querySelector('[aria-label="Profile"]').value, text: h.root().innerText };
})()
