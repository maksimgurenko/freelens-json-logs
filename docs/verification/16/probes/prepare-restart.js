(async () => {
  const p = global.__rl16, { root, click, input, config, assert } = p;
  if (root().querySelector('.rl-profile-editor')) await click('Close profiles');
  await input('Profile', config().profiles[1].id);
  await click('Raw'); await input('Find in logs', 'Temporary restart query');
  const wrap = [...root().querySelectorAll('label')].find(el => el.textContent === 'Word wrap').querySelector('input'); wrap.click();
  const timestamps = [...root().querySelectorAll('label')].find(el => el.textContent === 'Show timestamps').querySelector('input'); timestamps.click();
  await click('Profiles'); await input('Saved profile', config().profiles[0].id); await click('Edit');
  await input('Profile name', 'Unsaved draft must disappear'); await input('Sample logs', 'Temporary sample must disappear');
  const saved = config();
  assert(!JSON.stringify(saved).includes('must disappear'), 'Draft/sample persisted');
  const result = { configuration: saved, temporary: { manual: root().querySelector('select[aria-label="Profile"]').value,
    query: root().querySelector('input[aria-label="Find in logs"]').value, draft: root().querySelector('input[aria-label="Profile name"]').value,
    sample: root().querySelector('textarea[aria-label="Sample logs"]').value, paused: !!p.button('Resume'), raw: p.button('Raw').getAttribute('aria-pressed'), wrap: wrap.checked, timestamps: timestamps.checked } };
  p.restore(); result.transportRestored = !global.__rl16;
  return result;
})()
