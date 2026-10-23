(async () => {
  const p = global.__rl16, { root, click, input, config, assert, waitConfig } = p;
  if (!root().querySelector('.rl-profile-editor')) await click('Profiles');
  const profiles = config().profiles.slice();
  p.cleanupOriginalDefault = config().globalDefault;
  assert(profiles.every(profile => profile.name.startsWith('Ticket 16 ')), 'Refuse to remove an unrelated saved profile');
  for (const profile of profiles) {
    await input('Saved profile', profile.id); await click('Delete'); await click('Confirm delete');
    await waitConfig(c => !c.profiles.some(value => value.id === profile.id));
    if (profile.id === p.cleanupOriginalDefault) assert(config().globalDefault === 'default', 'Deleting global default did not restore Default');
  }
  assert(config().globalDefault === 'default', 'Global-default deletion did not restore built-in fallback');
  await click('Close profiles');
  assert(root().querySelector('select[aria-label="Profile"]').value === '', 'Deleting selected profile retained manual choice');
  assert(root().querySelector('.rl-row .rl-message').textContent === 'Default message', 'Default did not reformat retained records after deletion');
  const result = { configuration: config(), globalDefaultRestored: true, manual: root().querySelector('select[aria-label="Profile"]').value, message: root().querySelector('.rl-row .rl-message').textContent };
  p.restore(); result.transportRestored = !global.__rl16;
  return result;
})()
