(async () => {
  const h = global.__rl17, fs = require('fs');
  if (h.root().querySelector('.rl-profile-editor')) await h.click('Close profiles');
  const before = JSON.parse(fs.readFileSync('/home/max/work/freelens-json-logs/docs/verification/17/prepare-restart.json', 'utf8')).result.value.configuration;
  const after = h.config(), withoutMetadata = c => { const { __internal__, ...rest } = c; return rest; };
  h.assert(JSON.stringify(withoutMetadata(before)) === JSON.stringify(withoutMetadata(after)), 'Update changed saved matching settings');
  h.assert(h.active() === 'Ticket17 second renamed' && h.message() === 'Second api', 'Update lost saved order');
  h.ids = Object.fromEntries(after.profiles.map(p => [p.name === 'Ticket17 second renamed' ? 'second' : p.name.slice('Ticket17 '.length), p.id]));
  return { before, after, active: h.active(), message: h.message(), fullSettingsPreserved: true };
})()
