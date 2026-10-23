(async()=>{
 const p=global.__rl15,{assert,query,click,root,rows}=p;
 const before=p.requests.length;
 const results=[];
 const expect=async(value,count,index)=>{const result=await query(value);assert(result.counter===`${count?1:0} of ${count} matching records`,'Counter mismatch '+value+': '+result.counter);assert(result.current===index,'Wrong first result '+value);assert(result.rows===180,'Find filtered rows');results.push({query:value,...result});};
 await expect('decoded α',1,19);
 await expect('PRIVATE.NEEDLE[0]',178,0);
 await expect('.*',0,-1);
 const line=await global.LensExtensions.Renderer.K8sApi.podsApi.getLogs({namespace:'readable-logs-ticket-15',name:'navigation'},{container:'records',tailLines:1,timestamps:true,follow:false,previous:false});
 const stamp=line.split(' ')[0];
 await expect(stamp,0,-1);
 await expect('REPEATED MESSAGE',2,29);
 await click('Next');assert(root().querySelector('.rl-find-count').textContent==='2 of 2 matching records','Next count');assert(root().querySelector('.rl-find-current').dataset.recordIndex==='30','Next index');
 await click('Next');assert(root().querySelector('.rl-find-current').dataset.recordIndex==='29','Next did not wrap');
 await click('Previous');assert(root().querySelector('.rl-find-current').dataset.recordIndex==='30','Previous did not wrap');
 const input=root().querySelector('input[type=search]');input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await p.tick();assert(root().querySelector('.rl-find-current').dataset.recordIndex==='29','Enter');
 input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',shiftKey:true,bubbles:true}));await p.tick();assert(root().querySelector('.rl-find-current').dataset.recordIndex==='30','Shift Enter');
 await click('Raw');assert(root().querySelector('.rl-find-count').textContent==='2 of 2 matching records','Raw changed predicate');
 await query(stamp);assert(root().querySelector('.rl-find-count').textContent==='0 of 0 matching records','Raw searched timestamp');
 await click('Readable');await query('');
 assert(root().querySelector('.rl-find-count').textContent==='Enter text to find','Empty query');assert(p.button('Previous').disabled&&p.button('Next').disabled,'Empty query navigation enabled');
 for(const label of ['Show timestamps','Word wrap']){[...root().querySelectorAll('label')].find(l=>l.textContent===label).querySelector('input').click();await p.tick();}
 assert(p.requests.length===before,'Local Find/toggle actions made log requests');
 for(const label of ['Show timestamps','Word wrap']){[...root().querySelectorAll('label')].find(l=>l.textContent===label).querySelector('input').click();await p.tick();}
 assert(p.button('Resume'),'Local controls changed Pause');
 await click('To bottom');
 return {results,wrapping:true,enterAndShiftEnter:true,noFiltering:true,transportTimestampExcluded:stamp,rawPredicateUnchanged:true,localExtensionRequests:p.requests.length-before,paused:true,geometry:p.geometry()};
})()
