(async () => {
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const tick = () => new Promise(resolve => setTimeout(resolve, 80));
  const root = () => document.querySelector('.readable-logs');
  for (let i = 0; i < 120 && root()?.querySelectorAll('.rl-row').length !== 1; i++) await tick();
  assert(root()?.dataset.version === '0.1.16', 'Wrong installed package');
  assert(root().querySelectorAll('.rl-row').length === 1, 'Missing actual fixture record');
  const button = text => [...root().querySelectorAll('button')].find(el => el.textContent === text);
  const click = async text => { const el = button(text); assert(el && !el.disabled, 'Unavailable ' + text); el.click(); await tick(); };
  const input = async (label, value) => {
    const el = root().querySelector(`input[aria-label="${label}"], select[aria-label="${label}"], textarea[aria-label="${label}"]`);
    assert(el && !el.disabled, 'Unavailable ' + label);
    const prototype = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); await tick();
  };
  const enabled = async value => { const el = root().querySelector('[aria-label="Enabled for matching"]'); assert(el && !el.disabled, 'Matching unavailable'); if (el.checked !== value) { el.click(); await tick(); } };
  const ariaClick = async label => { const el = root().querySelector(`button[aria-label="${label}"]`); assert(el && !el.disabled, 'Unavailable ' + label); el.click(); await tick(); };
  const fs = require('fs'), path = require('path'), home = require('os').homedir();
  const configPath = path.join(home, '.config/Freelens/extension-store/freelens-readable-logs/readable-logs.json');
  const config = () => JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const waitConfig = async predicate => { for (let i = 0; i < 100; i++) { const data = config(); if (predicate(data)) return data; await tick(); } throw Error('Saved config not observed'); };
  const requests = [], restores = [];
  for (const protocol of ['http', 'https']) {
    const mod = require(protocol), original = mod.request;
    mod.request = function (...args) {
      const request = original.apply(this, args);
      if (/\/namespaces\/readable-logs-ticket-17(?:-other)?\/pods\/profiles\/log(?:\?|$)/.test(request.path) && request.path.includes('tailLines=1000')) {
        const record = { path: request.path, started: Date.now() }; requests.push(record);
        request.on('response', response => { record.status = response.statusCode; response.on('end', () => { record.settled = Date.now(); }); });
      }
      return request;
    };
    restores.push(() => { mod.request = original; });
  }
  if (button('Pause')) await click('Pause');
  await input('Profile', '');
  const active = () => root().querySelector('.rl-identity').textContent.split('Active profile ')[1];
  const message = () => root().querySelector('.rl-row .rl-message')?.textContent;
  global.__rl17 = { assert, tick, root, button, click, input, enabled, ariaClick, config, waitConfig, requests, active, message,
    restore() { for (const restore of restores) restore(); delete global.__rl17; } };
  return { host: global.LensExtensions.Common.Util.getAppVersion(), version: root().dataset.version,
    configuration: config(), text: root().innerText, paused: !!button('Resume') };
})()
