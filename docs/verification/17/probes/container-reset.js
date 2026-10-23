(async () => {
  const h = global.__rl17, before = h.requests.length;
  await h.click('Profiles'); await h.input('Saved profile', h.ids.second); await h.click('Edit'); await h.enabled(false); await h.click('Save profile');
  await h.input('Global default', h.ids.second); await h.click('Close profiles'); await h.input('Profile', h.ids.first);
  h.assert(h.active() === 'Ticket17 first', 'Manual setup missing');
  await h.input('Container', 'worker');
  for (let i = 0; i < 100 && h.message() !== 'Second worker'; i++) await h.tick();
  h.assert(h.message() === 'Second worker' && h.active() === 'Ticket17 second renamed', 'Disabled global fallback not applied to worker');
  h.assert(h.root().querySelector('[aria-label="Profile"]').value === '', 'Container change retained manual choice');
  h.assert(h.button('Pause'), 'New target inherited Pause'); await h.click('Pause');
  const worker = { active: h.active(), message: h.message(), manual: h.root().querySelector('[aria-label="Profile"]').value };
  await h.input('Profile', h.ids.fallback); await h.input('Container', 'api');
  for (let i = 0; i < 100 && h.message() !== 'First α🙂\napi'; i++) await h.tick();
  h.assert(h.message() === 'First α🙂\napi' && h.root().querySelector('[aria-label="Profile"]').value === '', 'Return container did not reevaluate');
  await h.click('Pause'); await h.click('Profiles'); await h.input('Global default', h.ids.fallback); await h.click('Close profiles');
  const requests = h.requests.slice(before); h.assert(requests.length === 2 && requests.every(r => r.status === 200 && r.settled), 'Expected exactly two real container reads');
  return { worker, api: { active: h.active(), message: h.message() }, requests, configuration: h.config(), assertions: ['container clears manual', 'fresh automatic target', 'disabled global allowed', 'matching wins over global', 'two real reads'] };
})()
