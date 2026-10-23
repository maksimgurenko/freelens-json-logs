(async () => {
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const tick = () => new Promise(resolve => setTimeout(resolve, 80));
  const root = () => document.querySelector('.readable-logs');
  for (let i = 0; i < 120 && root()?.querySelectorAll('.rl-row').length !== 2; i++) await tick();
  assert(root()?.dataset.version === '0.1.15', 'Wrong reopened package');
  const button = text => [...root().querySelectorAll('button')].find(el => el.textContent === text);
  const fs = require('fs'), path = require('path'), home = require('os').homedir();
  const configuration = JSON.parse(fs.readFileSync(path.join(home, '.config/Freelens/extension-store/freelens-readable-logs/readable-logs.json'), 'utf8'));
  const before = JSON.parse(fs.readFileSync('/home/max/work/freelens-json-logs/docs/verification/16/prepare-restart.json', 'utf8')).result.value.configuration;
  assert(JSON.stringify(configuration) === JSON.stringify(before), 'Full saved configuration differs after normal quit/reopen');
  const initial = { manual: root().querySelector('select[aria-label="Profile"]').value,
    query: root().querySelector('input[aria-label="Find in logs"]').value, automatic: !!button('Pause'), raw: button('Raw').getAttribute('aria-pressed'),
    wrap: [...root().querySelectorAll('label')].find(el => el.textContent === 'Word wrap').querySelector('input').checked,
    timestamps: [...root().querySelectorAll('label')].find(el => el.textContent === 'Show timestamps').querySelector('input').checked,
    inspection: root().querySelector('select[aria-label="Inspection"]').value,
    message: root().querySelector('.rl-row .rl-message').textContent };
  assert(initial.manual === '' && initial.query === '' && initial.automatic && initial.raw === 'false' && !initial.wrap && initial.timestamps, 'Temporary view state did not reset');
  assert(initial.inspection === 'bottom' && initial.message === 'Nested α🙂\nmessage', 'Saved configuration not applied');
  button('Pause').click(); await tick(); button('Profiles').click(); await tick();
  const editor = { selected: root().querySelector('select[aria-label="Saved profile"]').value,
    sample: root().querySelector('textarea[aria-label="Sample logs"]').value,
    name: root().querySelector('input[aria-label="Profile name"]').value, nameDisabled: root().querySelector('input[aria-label="Profile name"]').disabled };
  assert(editor.selected === 'default' && editor.sample === '' && editor.name === 'Default' && editor.nameDisabled, 'Draft/sample restored unexpectedly');
  return { configuration, initial, editor, fullConfigurationPreserved: true, pausedAfterCheck: true };
})()
