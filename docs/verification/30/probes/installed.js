(async () => {
  for(let i=0;i<120;i++) {
    const text=document.body.innerText;
    if (text.includes('has failed')) throw Error(text);
    const row=[...document.querySelectorAll('[id^="menu-actions-for-installed-extensions-for-"]')].find(e=>e.id.includes('/freelens-readable-logs/'))?.closest('.tr');
    const cells=[...row?.querySelectorAll('.td')??[]].map(e=>e.textContent.trim());
    if(cells.includes('0.1.33') && cells.includes('Enabled')) return {url:location.href,body:text,frames:document.querySelectorAll('iframe').length};
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw Error('No Enabled package after 12 seconds');
})()
