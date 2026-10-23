(async()=>{
 const assert=(condition,message)=>{if(!condition)throw Error(message);};
 const tick=()=>new Promise(r=>setTimeout(r,60));
 const root=()=>document.querySelector('.readable-logs');
 for(let i=0;i<120&&root()?.querySelectorAll('.rl-row').length!==180;i++)await tick();
 assert(root()?.dataset.version==='0.1.12','Wrong package');
 assert(root().querySelectorAll('.rl-row').length===180,'Expected initial real 180 records');
 const button=text=>[...root().querySelectorAll('button')].find(b=>b.textContent===text);
 const click=async text=>{const b=button(text);assert(b&&!b.disabled,'Unavailable '+text);b.click();await tick();};
 const rows=()=>[...root().querySelectorAll('.rl-record')];
 const scroller=()=>root().querySelector('.rl-records');
 const geometry=()=>{const el=scroller();return {top:el.scrollTop,height:el.clientHeight,total:el.scrollHeight,bottom:el.scrollHeight-el.clientHeight-el.scrollTop,following:root().querySelector('.rl-follow-status').textContent};};
 const anchor=()=>{const el=scroller(),top=el.getBoundingClientRect().top+el.clientTop;const row=rows().find(r=>r.getBoundingClientRect().bottom>top);return {index:Number(row.dataset.recordIndex),offset:row.getBoundingClientRect().top-top,text:row.querySelector('.rl-message').textContent};};
 const query=async value=>{const el=root().querySelector('input[type=search]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));await tick();return {counter:root().querySelector('.rl-find-count').textContent,current:Number(root().querySelector('.rl-find-current')?.dataset.recordIndex??-1),rows:rows().length};};
 const scrollTo=async(index,offset=0)=>{const el=scroller(),row=rows()[index];el.scrollTop+=row.getBoundingClientRect().top-el.getBoundingClientRect().top-offset;await tick();return anchor();};
 const requests=[],restores=[];
 for(const protocol of ['http','https']){
  const mod=require(protocol),original=mod.request;
  mod.request=function(...args){const req=original.apply(this,args);if(/\/namespaces\/readable-logs-ticket-15\/pods\/navigation\/log(?:\?|$)/.test(req.path)&&req.path.includes('tailLines=1000')){const record={path:req.path,started:Date.now()};requests.push(record);req.on('response',res=>{record.status=res.statusCode;res.on('end',()=>record.settled=Date.now());});}return req;};
  restores.push(()=>mod.request=original);
 }
 global.__rl15={assert,tick,root,button,click,rows,scroller,geometry,anchor,query,scrollTo,requests,restore(){for(const restore of restores)restore();delete global.__rl15;}};
 const initial={version:root().dataset.version,geometry:geometry(),query:root().querySelector('input[type=search]').value,timestamps:[...root().querySelectorAll('label')].find(l=>l.textContent==='Show timestamps').querySelector('input').checked,wrap:[...root().querySelectorAll('label')].find(l=>l.textContent==='Word wrap').querySelector('input').checked};
 assert(initial.geometry.bottom<=2,'New view did not start at bottom');
 assert(initial.timestamps&&!initial.wrap&&initial.query==='','Wrong new-view defaults');
 await click('Pause');
 return {initial,paused:!!button('Resume'),node:process.versions.node,host:global.LensExtensions.Common.Util.getAppVersion()};
})()
