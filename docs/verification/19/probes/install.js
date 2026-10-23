(async () => {
  const input = document.querySelector('input[placeholder="Name or file path or URL"]');
  if (!input) throw Error('Extensions input missing');
  if (document.querySelector('[id*="menu-actions-for-installed-extensions-for-"][id*="/freelens-readable-logs/"]')) throw Error('Package already present; explicit uninstall required');
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '/home/max/work/freelens-json-logs/.scratch/readable-logs/19/clean-0.1.20/dist/freelens-readable-logs-0.1.20.tgz');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise(resolve => setTimeout(resolve, 150));
  const install = [...document.querySelectorAll('button')].find(button => button.textContent === 'Install');
  if (!install || install.disabled) throw Error('Install unavailable');
  install.click();
  return {clickCount: 1, tarball: input.value, at: new Date().toISOString()};
})()
