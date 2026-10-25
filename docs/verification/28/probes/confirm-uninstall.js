(() => {
  if (!document.body.innerText.includes('uninstall extension freelens-readable-logs@')) throw Error('No expected uninstall confirmation');
  const yes = [...document.querySelectorAll('button')].find(el => el.textContent === 'Yes');
  if (!yes) throw Error('Yes unavailable'); yes.click(); return { confirmed: true };
})()
