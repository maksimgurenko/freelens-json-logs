(async () => {
  const h = global.__rl17;
  if (h.button('Cancel')) await h.click('Cancel');
  if (h.root().querySelector('.rl-profile-editor')) await h.click('Close profiles');
  await h.input('Profile', h.ids.first);
  await h.click('Profiles'); await h.input('Saved profile', h.ids.first); await h.click('Edit');
  await h.input('Match namespace', 'Unsaved namespace must disappear'); await h.enabled(false);
  const saved = h.config();
  h.assert(!JSON.stringify(saved).includes('must disappear'), 'Draft matching persisted');
  const result = { configuration: saved, manual: h.root().querySelector('select[aria-label="Profile"]').value,
    unsavedNamespace: h.root().querySelector('[aria-label="Match namespace"]').value, requests: h.requests };
  h.restore(); result.transportRestored = !global.__rl17; return result;
})()
