(async () => {
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const tick = () => new Promise(resolve => setTimeout(resolve, 80)), root = () => document.querySelector('.readable-logs');
  for (let i = 0; i < 100 && root()?.querySelector('.rl-row .rl-message')?.textContent !== 'Second api'; i++) await tick();
  assert(root()?.dataset.version === '0.1.16', 'Wrong restarted package');
  const fs = require('fs'), path = require('path'), home = require('os').homedir();
  const configuration = JSON.parse(fs.readFileSync(path.join(home, '.config/Freelens/extension-store/freelens-readable-logs/readable-logs.json'), 'utf8'));
  const before = JSON.parse(fs.readFileSync('/home/max/work/freelens-json-logs/docs/verification/17/prepare-restart.json', 'utf8')).result.value.configuration;
  assert(JSON.stringify(configuration) === JSON.stringify(before), 'Full configuration changed across normal full quit/reopen');
  const button = text => [...root().querySelectorAll('button')].find(el => el.textContent === text);
  const initial = { active: root().querySelector('.rl-identity').textContent, message: root().querySelector('.rl-message')?.textContent,
    manual: root().querySelector('select[aria-label="Profile"]').value, inspection: root().querySelector('select[aria-label="Inspection"]').value, automatic: !!button('Pause') };
  assert(initial.manual === '' && initial.automatic && initial.message === 'Second api' && initial.inspection === 'bottom', 'Saved matching order/default/Inspection or temporary reset failed');
  button('Pause').click(); await tick(); button('Profiles').click(); await tick();
  assert(root().querySelector('[aria-label="Profile name"]').disabled && !root().querySelector('[aria-label="Match namespace"]').value, 'Draft restored');
  return { configuration, initial, fullConfigurationPreserved: true, manualAndDraftReset: true, pausedAfterCheck: true };
})()
