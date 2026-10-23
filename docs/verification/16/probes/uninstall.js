(() => {
  const item = [...document.querySelectorAll('.MenuItem')].find(el => el.textContent.includes('Uninstall'));
  if (!item) throw Error('Uninstall unavailable'); item.click(); return { body: document.body.innerText };
})()
