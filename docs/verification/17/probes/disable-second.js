(async () => {
  const h = global.__rl17;
  if (!h.root().querySelector('.rl-profile-editor')) await h.click('Profiles');
  await h.input('Saved profile', h.ids.second); await h.click('Edit'); await h.enabled(false); await h.click('Save profile');
  await h.waitConfig(c => !c.profiles.find(p => p.id === h.ids.second).matching.enabled);
  await h.click('Close profiles');
  return { active: h.active(), configuration: h.config() };
})()
