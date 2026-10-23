(async () => {
  const p = global.__rl16;
  await p.click('Profiles');
  for (const profile of p.config().profiles) {
    p.assert(profile.name.startsWith('Ticket 16 '), 'Refuse to remove an unrelated profile');
    await p.input('Saved profile', profile.id); await p.click('Delete'); await p.click('Confirm delete');
    await p.waitConfig(c => !c.profiles.some(value => value.id === profile.id));
  }
  await p.click('Close profiles'); p.restore();
  return { removedOnlyTicket16Profiles: true, observationRestored: !global.__rl16 };
})()
