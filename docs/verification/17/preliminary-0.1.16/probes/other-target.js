(async () => {
  const h = global.__rl17;
  for (let i = 0; i < 100 && h.message() !== 'Fallback api'; i++) await h.tick();
  h.assert(h.root().innerText.includes('readable-logs-ticket-17-other') && h.active() === 'Ticket17 fallback', 'Namespace condition ignored');
  h.assert(h.root().querySelector('[aria-label="Profile"]').value === '', 'New Pod retained manual');
  await h.click('Pause');
  const before = h.requests.length;
  await h.click('Profiles'); await h.input('Saved profile', h.ids.second); await h.click('Edit'); await h.enabled(true); await h.click('Save profile');
  await h.waitConfig(c => c.profiles.find(p => p.id === h.ids.second).matching.enabled);
  h.assert(h.active() === 'Ticket17 second renamed', 'Namespace omission incorrectly restricted match');
  await h.click('Close profiles'); h.assert(h.message() === 'Second api', 'Other target did not reformat');
  h.assert(h.requests.length === before, 'Enabling matching fetched logs');
  return { active: h.active(), message: h.message(), text: h.root().innerText, configuration: h.config(), requests: h.requests.slice(before), allObservedRequests: h.requests };
})()
