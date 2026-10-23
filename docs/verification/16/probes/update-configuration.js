(() => {
  const p = global.__rl16, configuration = p.config(), fs = require('fs');
  const before = JSON.parse(fs.readFileSync('/home/max/work/freelens-json-logs/docs/verification/16/config-before-update.json', 'utf8'));
  const manifest = JSON.parse(fs.readFileSync('/home/max/work/freelens-json-logs/package.json', 'utf8'));
  const data = ({ __internal__, ...rest }) => rest;
  p.assert(JSON.stringify(data(configuration)) === JSON.stringify(data(before)), 'Full profile configuration changed on explicit update');
  p.assert(p.root().dataset.version === manifest.version, 'Wrong actual package');
  return { configuration, fullConfigurationPreserved: true, manual: p.root().querySelector('select[aria-label="Profile"]').value, version: manifest.version };
})()
