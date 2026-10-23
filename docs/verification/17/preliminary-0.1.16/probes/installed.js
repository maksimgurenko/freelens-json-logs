(async () => {
  for(let i=0;i<120;i++) {
    const text=document.body.innerText;
    if (text.includes('has failed')) throw Error(text);
    if(text.includes('freelens-readable-logs') && text.includes('0.1.16') && text.includes('Enabled')) return {url:location.href,body:text,frames:document.querySelectorAll('iframe').length};
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw Error('No Enabled package after 12 seconds');
})()
