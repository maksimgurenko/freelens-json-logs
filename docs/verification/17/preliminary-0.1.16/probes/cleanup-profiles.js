(async () => {
  const h = global.__rl17, before = h.requests.length;
  const profiles = h.config().profiles;
  h.assert(profiles.length === 4 && profiles.every(p => p.name.startsWith('Ticket17 ')), 'Refuse unrelated profile deletion');
  const first = profiles.find(p => p.name === 'Ticket17 first'), second = profiles.find(p => p.name === 'Ticket17 second renamed');
  const fallback = profiles.find(p => p.name === 'Ticket17 fallback'), conditionless = profiles.find(p => p.name === 'Ticket17 conditionless');
  if (h.root().querySelector('.rl-profile-editor')) await h.click('Close profiles');
  await h.input('Profile', first.id); await h.click('Profiles');
  const remove = async profile => {
    await h.input('Saved profile', profile.id); await h.click('Delete'); await h.click('Confirm delete');
    await h.waitConfig(c => !c.profiles.some(p => p.id === profile.id));
  };
  await remove(first);
  h.assert(h.root().querySelector('select[aria-label="Profile"]').value === '' && h.active() === second.name, 'Deleted manual profile did not return to matching Auto');
  const manualDeleted = { active: h.active(), manual: h.root().querySelector('select[aria-label="Profile"]').value };
  await remove(fallback); h.assert(h.config().globalDefault === 'default' && h.active() === second.name, 'Global deletion bypassed matching');
  const globalDeleted = { active: h.active(), globalDefault: h.config().globalDefault };
  await remove(second); h.assert(h.active() === 'Default', 'Conditionless profile incorrectly matched');
  await remove(conditionless); await h.click('Close profiles');
  h.assert(h.message() === 'Default api' && h.config().profiles.length === 0 && h.config().globalDefault === 'default', 'Cleanup fallback failed');
  h.assert(h.requests.length === before, 'Profile deletion fetched logs');
  const result = { manualDeleted, globalDeleted, configuration: h.config(), active: h.active(), message: h.message(), requests: h.requests.slice(before) };
  h.restore(); result.transportRestored = !global.__rl17; return result;
})()
