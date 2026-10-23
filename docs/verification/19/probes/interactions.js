(async () => {
  const h=global.__rl19,{assert,input,click,tick,root,state,requests}=h;
  await input('Container','malformed');for(let i=0;(!state().snapshot||state().refreshing)&&i<2000;i++)await tick(2);if(h.button('Pause'))await click('Pause');
  const originals=state().snapshot.records.map(r=>({application:r.applicationText,transport:r.transportLine}));
  const before=requests.length,layouts=[],copies=[];
  root().querySelectorAll('.rl-row')[8].click();await tick();
  for(const layout of ['inline','side','bottom']){await input('Inspection',layout);assert(root().querySelector('.rl-work').classList.contains('rl-layout-'+layout)&&root().querySelector('.rl-selected')?.dataset.recordIndex==='8','Layout/selection failed');const full=JSON.parse(root().querySelector('[aria-label="Complete record"]').textContent);assert(full.msg==='decoded α\nline'&&full.hidden==='Private.Needle[0]'&&full.x[1]===null,'All fields lost');layouts.push({layout,selected:8,complete:true});}
  await click('Raw');assert(root().querySelectorAll('.rl-message')[8].textContent===originals[8].transport,'Raw transport changed');
  const timestamps=[...root().querySelectorAll('label')].find(e=>e.textContent==='Show timestamps').querySelector('input');timestamps.click();await tick();assert(root().querySelectorAll('.rl-message')[8].textContent===originals[8].application,'Raw application changed');timestamps.click();await tick();await click('Readable');
  const clipboard=require('electron').clipboard,saved={text:clipboard.readText(),html:clipboard.readHTML(),rtf:clipboard.readRTF(),image:clipboard.readImage()},formats=clipboard.availableFormats();
  try{for(let i=0;i<originals.length;i++){root().querySelectorAll('.rl-row')[i].click();await tick();for(const [kind,label,copy] of [['application','Application text','Copy application text'],['transport','Transport line','Copy transport line']]){await click(label);const shown=root().querySelector(`[aria-label="Original ${kind==='application'?'application text':'transport line'}"]`).textContent;assert(shown===originals[i][kind],'Inspector original mismatch');clipboard.writeText('ticket-19-before-copy');await click(copy);const actual=clipboard.readText();assert(actual===originals[i][kind],'Real clipboard differs');copies.push({index:i,kind,expected:originals[i][kind],actual});}}}finally{clipboard.write(saved);}
  const searches=[];for(const [query,count] of [['PRIVATE.NEEDLE[0]',1],['decoded α',1],['.*',0],[originals[8].transport.split(' ')[0],0]]){await input('Find in logs',query);const counter=root().querySelector('.rl-find-count').textContent;assert(counter.endsWith('of '+count+' matching records'),'Find counter mismatch');searches.push({query,counter});}
  await input('Find in logs','');assert(requests.length===before,'Local interactions fetched logs');
  return {version:root().dataset.version,layouts,copies,clipboardFormats:formats,clipboardRestored:true,searches,zeroLogRequests:true,retainedRows:originals.length};
})()
