(async () => {
  const h = global.__rl17, before = h.requests.length;
  await h.input('Profile', h.ids.first); h.assert(h.active() === 'Ticket17 first', 'Manual failed against nonmatching labels');
  await h.input('Profile', ''); h.assert(h.active() === 'Ticket17 fallback', 'Auto failed after manual clearing');
  await h.click('Profiles'); await h.input('Saved profile', h.ids.second); await h.click('Edit'); await h.enabled(true); await h.click('Save profile');
  await h.waitConfig(c => c.profiles.find(p => p.id === h.ids.second).matching.enabled);
  for (let i = 0; i < 100 && h.active() !== 'Ticket17 second renamed'; i++) await h.tick();
  h.assert(h.active() === 'Ticket17 second renamed', 'Omitted namespace/tier conditions restricted broad match');
  await h.click('Close profiles'); h.assert(h.message() === 'Second api', 'Enable did not reformat');
  h.assert(h.requests.length === before, 'Manual/enable fetched logs');
  return { active: h.active(), message: h.message(), configuration: h.config(), requests: h.requests.slice(before),
    assertions: ['manual overrides failing labels', 'Auto reevaluates', 'enable applies broad conditions with tier absent', 'no additional log request'] };
})()
