(async () => {
  const root = () => document.querySelector('.readable-logs');
  for (let i = 0; i < 100 && root()?.querySelectorAll('.rl-row').length !== 1; i++) await new Promise(resolve => setTimeout(resolve, 80));
  if (root()?.dataset.version !== '0.1.17' || root().querySelectorAll('.rl-row').length !== 1) throw Error('Final shared viewer missing');
  const pause = [...root().querySelectorAll('button')].find(el => el.textContent === 'Pause'); if (pause) pause.click();
  const fs = require('fs'), path = require('path'), home = require('os').homedir();
  const configuration = JSON.parse(fs.readFileSync(path.join(home, '.config/Freelens/extension-store/freelens-readable-logs/readable-logs.json'), 'utf8'));
  if (configuration.profiles.length || configuration.globalDefault !== 'default' || configuration.viewer.inspection !== 'bottom') throw Error('Final configuration cleanup failed');
  return { version: root().dataset.version, host: global.LensExtensions.Common.Util.getAppVersion(), node: process.versions.node,
    configuration, text: root().innerText, transportProbePresent: !!global.__rl17, loadedEntry: Object.keys(require.cache).filter(key => key.includes('freelens-readable-logs') && /renderer-.*\.js$/.test(key)) };
})()
