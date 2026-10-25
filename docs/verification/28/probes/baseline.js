(() => {
  const fs = require('fs'), path = require('path'), crypto = require('crypto');
  const home = require('os').homedir(), project = '/home/max/work/freelens-json-logs';
  const installed = path.join(home, '.freelens/extensions/freelens-readable-logs');
  const manifest = JSON.parse(fs.readFileSync(path.join(installed, 'package.json')));
  const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
  const files = ['package.json', manifest.main, manifest.renderer, 'docs/local-development.md'].map(file => ({
    file, installed: hash(fs.readFileSync(path.join(installed, file))), source: hash(fs.readFileSync(path.join(project, file))),
  }));
  if (!files.every(file => file.installed === file.source)) throw Error('Installed package differs from checkout');
  const tarball = path.join(project, 'dist', `freelens-readable-logs-${manifest.version}.tgz`);
  const root = document.querySelector('.readable-logs'), c = require('electron').clipboard;
  const settings = path.join(home, '.config/Freelens/extension-store/freelens-readable-logs/readable-logs.json');
  let remote;
  try {
    const api = require('@electron/remote'), window = api.getCurrentWindow();
    remote = { available: true, windowId: window.id, ownerPid: api.process.pid,
      webContentsId: window.webContents.id, url: window.webContents.getURL(), focused: window.isFocused() };
  } catch (error) { remote = { available: false, error: error.message }; }
  return {
    at: new Date().toISOString(), host: global.LensExtensions.Common.Util.getAppVersion(),
    electron: process.versions.electron, chromium: process.versions.chrome, platform: process.platform,
    rendererPid: process.pid, manifest, files, tarballSha256: hash(fs.readFileSync(tarball)), remote,
    settingsSha256: hash(fs.readFileSync(settings)),
    clipboard: { formats: c.availableFormats(), buffers: Object.fromEntries(c.availableFormats().map(format => [format, hash(c.readBuffer(format))])), pixels: hash(c.readImage().toBitmap()) },
    view: {
      url: location.href, historyLength: history.length, version: root?.dataset.version,
      rows: root?.querySelectorAll('.rl-row').length, profiles: !!root?.querySelector('.rl-profile-editor'),
      findOpen: !root?.querySelector('.rl-findbar')?.hidden, query: root?.querySelector('#rl-find')?.value,
      scrollTop: root?.querySelector('.rl-records')?.scrollTop, selected: root?.querySelector('.rl-selected')?.dataset.recordIndex ?? null,
      paused: !![...root?.querySelectorAll('button') ?? []].find(el => el.textContent === 'Resume'),
      documentFocus: document.hasFocus(), focus: document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName,
      dockTabs: [...document.querySelectorAll('.Dock .Tab')].map(el => ({ id: el.id, label: el.textContent })),
      existingTestHelpers: Object.keys(global).filter(name => /^__cv\d/.test(name)),
    },
  };
})()
