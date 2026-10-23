(() => {
  if (document.querySelectorAll('iframe').length) throw Error('Maintenance requires a fresh main window before opening a cluster');
  const menu = [...document.querySelectorAll('[id^="menu-actions-for-installed-extensions-for-"]')].find(el => el.id.includes('/freelens-readable-logs/'));
  if (!menu) throw Error('Package action menu absent');
  menu.click(); return { body: document.body.innerText, frames: document.querySelectorAll('iframe').length };
})()
