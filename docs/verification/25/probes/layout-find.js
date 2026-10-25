(async()=>{
 const h=global.__cv25,{assert,tick,root,input,click,state}=h,results={};
 const byLabel=label=>root().querySelector(`input[aria-label="${label}"], select[aria-label="${label}"], textarea[aria-label="${label}"]`) ?? root().querySelector(`[aria-label="${label}"]`);
 const visible=el=>!!el?.getClientRects().length;
 const display=async(open=true)=>{const el=root().querySelector('.rl-display-options');if(el.open!==open){el.querySelector('summary').click();await tick();}};
 const inspect=async(i)=>{root().querySelectorAll('.rl-row')[i].click();await tick();};
 const close=async()=>{byLabel('Close record inspector')?.click();await tick();};
 const rowCount=()=>root().querySelectorAll('.rl-row').length;
 const count=()=>root().querySelector('.rl-find-count').textContent;
 const select=async(name)=>{await input('Container',name);for(let i=0;i<1000;i++){if(state().snapshot&&!state().refreshing&&!state().waiting)break;await tick(5);}assert(state().snapshot,'No actual snapshot');if(h.button('Pause'))await click('Pause');};
 h.display=display;h.select=select;
 await select('bounded');await close();await display();await click('Readable');await display(false);
 root().querySelector('[aria-label="Close Find"]').click();await tick();
 assert(!visible(root().querySelector('.rl-findbar')),'Find initially open');
 assert(!root().querySelector('.rl-detail'),'Empty inspector occupies space');
 assert(getComputedStyle(root().querySelector('.rl-records')).backgroundColor==='rgb(0, 0, 0)','Canvas not black');
 const bounds=()=>{const work=root().querySelector('.rl-work').getBoundingClientRect(),records=root().querySelector('.rl-records').getBoundingClientRect();return {work:{width:work.width,height:work.height},records:{width:records.width,height:records.height}};};
 const layouts=[];
 await display();
 for(const layout of ['inline','side','bottom']){
  await input('Inspection',layout);await close();
  assert(!root().querySelector('.rl-detail')&&!root().querySelector('.rl-inspector'),'Empty '+layout+' reserves a pane');
  const closed=bounds();assert(Math.abs(closed.work.width-closed.records.width)<1&&Math.abs(closed.work.height-closed.records.height)<1,'Empty layout not reclaimed');
  await inspect(10);assert(root().querySelector('.rl-detail')&&root().querySelector('.rl-selected')?.dataset.recordIndex==='10','Selected layout failed');
  const opened=bounds();await close();assert(!root().querySelector('.rl-detail'),'Close failed');
  assert(root().querySelector('select[aria-label="Inspection"]').value===layout,'Close lost saved layout');
  layouts.push({layout,closed,opened,closeReclaims:true});
 }
 results.layouts=layouts;await display(false);
 await click('Find');assert(visible(root().querySelector('.rl-findbar')),'Find not revealed');
 await input('Find in logs','ROW 00');const rows=rowCount(),before=count(),current=root().querySelector('.rl-find-current')?.dataset.recordIndex;
 await click('Previous');const previous=root().querySelector('.rl-find-current').dataset.recordIndex;assert(previous==='98','Previous did not wrap to final match');
 await click('Next');assert(root().querySelector('.rl-find-current').dataset.recordIndex==='0','Next did not wrap');
 byLabel('Close Find').click();await tick();assert(!visible(root().querySelector('.rl-findbar'))&&byLabel('Find in logs').value==='ROW 00','Close lost query');
 await click('Find');assert(count()===before&&root().querySelector('.rl-find-current').dataset.recordIndex===current,'Reopen lost matching state');
 assert(rowCount()===rows,'Find filtered records');
 results.findReopening={before,previousWrap:previous,query:byLabel('Find in logs').value,rows,retainsCurrent:true};
 await select('malformed');
 const originals=state().snapshot.records.map(r=>({application:r.applicationText,transport:r.transportLine}));
 const searches=[];
 for(const [query,total] of [['PRIVATE.NEEDLE[0]',1],['decoded α',1],['.*',0],[originals[8].transport.split(' ')[0],0],['',0]]){
  await input('Find in logs',query);assert(query?count().endsWith('of '+total+' matching records'):count()==='Enter text to find','Wrong Find '+query+': '+count());
  searches.push({query,count:count(),rows:rowCount()});
 }
 results.findPredicate=searches;
 await input('Find in logs','decoded α');await display();
 const readsBefore=h.requests.length;
 await inspect(8);await click('All fields');const full=JSON.parse(byLabel('Complete record').textContent);assert(full.hidden==='Private.Needle[0]'&&full.msg==='decoded α\nline','All fields changed');
 await click('Raw');assert(root().querySelectorAll('.rl-message')[8].textContent===originals[8].transport,'Raw differs');
 const check=label=>[...root().querySelectorAll('label')].find(el=>el.textContent===label).querySelector('input');
 check('Show timestamps').click();await tick();assert(root().querySelectorAll('.rl-message')[8].textContent===originals[8].application,'Raw without time differs');check('Show timestamps').click();check('Word wrap').click();await tick();assert(root().querySelector('.rl-records').classList.contains('rl-wrap'),'Wrap failed');check('Word wrap').click();await click('Readable');await display(false);
 const clipboard=require('electron').clipboard,formats=clipboard.availableFormats();
 const hashes=()=>Object.fromEntries(clipboard.availableFormats().map(f=>[f,require('crypto').createHash('sha256').update(clipboard.readBuffer(f)).digest('hex')]));
 const pixelHash=()=>require('crypto').createHash('sha256').update(clipboard.readImage().toBitmap()).digest('hex');
 const beforePixels=pixelHash(),beforeClipboard=hashes(),saved={text:clipboard.readText(),html:clipboard.readHTML(),rtf:clipboard.readRTF(),image:clipboard.readImage()};
 assert(formats.every(f=>/text|html|rtf|image|png|jpeg/i.test(f)),'Unsupported clipboard format; preserve before continuing');
 let copies=0;
 try{for(let i=0;i<originals.length;i++){await inspect(i);for(const [kind,label,copy] of [['application','Application text','Copy application text'],['transport','Transport line','Copy transport line']]){await click(label);assert(byLabel('Original '+(kind==='application'?'application text':'transport line')).textContent===originals[i][kind],'Original tab differs');await click(copy);assert(clipboard.readText()===originals[i][kind],'Exact clipboard differs');copies++;}}}finally{clipboard.write(saved);}
 // Electron can add equivalent standard formats on restore. Original format buffers must match.
 const afterClipboard=hashes();assert(Object.entries(beforeClipboard).every(([f,hash])=>f.startsWith('image/')||afterClipboard[f]===hash)&&pixelHash()===beforePixels,'Clipboard restoration differs');
 results.originals={copies,formats,originalClipboardFormatsRestored:formats.every(f=>clipboard.availableFormats().includes(f)),originalImagePixelsRestored:pixelHash()===beforePixels,allFields:true,raw:true,wrap:true,zeroLocalLogRequests:h.requests.length===readsBefore};assert(results.originals.zeroLocalLogRequests,'Local controls fetched');
 await close();
 await click('Edit profiles');await click('Duplicate');await input('Profile name','Compact verification profile with a deliberately long name for target selection and layout checks');await input('Message paths','/hidden');await click('Save profile');const profileId=byLabel('Saved profile').value;h.ownedProfileId=profileId;await click('Close profiles');
 await input('Profile',profileId);assert(count()==='0 of 0 matching records','Profile did not recompute decoded match');
 await input('Profile','default');assert(count().endsWith('of 1 matching records'),'Default did not recompute');await click('Next');assert(count()==='1 of 1 matching records','Next did not select recomputed result');
 results.profileRecompute={savedProfileId:profileId,changedMessageCount:0,defaultMessageCount:1};
 await input('Find in logs','PRIVATE.NEEDLE[0]');await select('empty');assert(rowCount()===0&&root().querySelector('.rl-empty')?.textContent.includes('No logs returned'),'Not genuine empty');
 assert(count()==='0 of 0 matching records'&&!root().querySelector('.rl-detail'),'Empty did not recompute/close');
 results.empty={rows:0,message:root().querySelector('.rl-empty').textContent,canvas:getComputedStyle(root().querySelector('.rl-records')).backgroundColor};
 await select('bounded');await input('Find in logs','');byLabel('Close Find').click();await tick();
 return {host:global.LensExtensions.Common.Util.getAppVersion(),version:root().dataset.version,...results};
})()
