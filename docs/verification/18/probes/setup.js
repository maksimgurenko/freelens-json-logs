(async () => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const tick = () => new Promise(resolve => setTimeout(resolve, 100));
  const root = () => document.querySelector('.readable-logs');
  for (let i = 0; i < 120 && root()?.querySelectorAll('.rl-row').length !== 1; i++) await tick();
  assert(root()?.dataset.version === '0.1.18', 'Wrong production version');
  assert(root()?.querySelectorAll('.rl-row').length === 1, 'Actual shared fixture log not displayed');
  const button = text => [...root().querySelectorAll('button')].find(el => el.textContent === text);
  const click = async text => { const el = button(text); assert(el && !el.disabled, 'Unavailable ' + text); el.click(); await tick(); };
  const input = async (label, value) => {
    const el = root().querySelector(`[aria-label="${label}"]`);
    assert(el && !el.disabled, 'Unavailable input ' + label);
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); await tick();
  };
  const fs = require('fs'), path = require('path'), home = require('os').homedir();
  const settingsPath = path.join(home, '.config/Freelens/extension-store/freelens-readable-logs/readable-logs.json');
  const backupDirectory = path.join(path.dirname(settingsPath), 'backups');
  const backups = () => fs.existsSync(backupDirectory) && fs.statSync(backupDirectory).isDirectory() ? fs.readdirSync(backupDirectory).sort() : [];
  const config = () => JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  const waitConfig = async predicate => { for (let i = 0; i < 100; i++) { const saved = config(); if (predicate(saved)) return saved; await tick(); } throw Error('Saved configuration not observed'); };
  let fiber = root()[Object.keys(root()).find(key => key.startsWith('__reactFiber$'))];
  while (fiber && !fiber.memoizedProps?.preferences) fiber = fiber.return;
  const store = fiber?.memoizedProps.preferences;
  assert(store && typeof store.resetSettings === 'function', 'Production settings store not found on extension component');
  if (button('Pause')) await click('Pause');
  global.__rl18 = { assert, tick, root, button, click, input, fs, path, settingsPath, backupDirectory, backups, config, waitConfig, store };
  return { version: root().dataset.version, host: global.LensExtensions.Common.Util.getAppVersion(),
    node: process.versions.node, saved: store.read(), paused: !!button('Resume'), text: root().innerText,
    entries: Object.keys(require.cache).filter(key => key.includes('freelens-readable-logs') && /renderer-.*\.js$/.test(key)) };
})()
