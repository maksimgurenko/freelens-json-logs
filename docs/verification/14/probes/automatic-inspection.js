(async()=>{
 if(document.hidden)throw Error('Host is hidden; show its workspace before this polling check');
 const root=document.querySelector('.readable-logs');
 let logReads=0;const transportReads=[],restores=[];
 for(const protocol of ['http','https']){
  const module=require(protocol),original=module.request;
  module.request=function(...args){const request=original.apply(this,args);if(/\/namespaces\/readable-logs-spike\/pods\/single-json\/log(?:\?|$)/.test(request.path)&&request.path.includes('tailLines=1000')){logReads++;const record={path:request.path,started:Date.now()};transportReads.push(record);request.on('response',response=>{record.status=response.statusCode;});}return request;};
  restores.push(()=>{module.request=original;});
 }
 const tick=()=>new Promise(r=>setTimeout(r,100));const saved=[];
 try {
  const resume=[...root.querySelectorAll('button')].find(b=>b.textContent==='Resume');resume?.click();await tick();
  root.querySelector('.rl-row').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await tick();
  const selection=root.querySelector('.rl-selected')?.dataset.recordIndex;
  if(selection!=='0')throw Error('Keyboard selection failed');
  for(const layout of ['inline','side','bottom']){
   const select=root.querySelector('[aria-label="Inspection"]');if(select.disabled)throw Error('Disabled Inspection');
   select.value=layout;select.dispatchEvent(new Event('change',{bubbles:true}));
   let data;for(let i=0;i<40;i++){
    await tick();data=JSON.parse(require('fs').readFileSync(require('os').homedir()+'/.config/Freelens/extension-store/freelens-readable-logs/readable-logs.json','utf8'));
    if(data.viewer?.inspection===layout)break;
   }
   if(data.viewer?.inspection!==layout||!root.querySelector('.rl-layout-'+layout))throw Error('Preference was not persisted/rendered: '+layout);
   if(root.querySelector('.rl-selected')?.dataset.recordIndex!==selection)throw Error('Selection lost');
   saved.push({layout,diskConfiguration:data,selection});
  }
  logReads=0;
  for(let i=0;i<55&&logReads===0;i++)await tick();
  if(logReads===0||![...root.querySelectorAll('button')].some(b=>b.textContent==='Pause'))throw Error('Automatic updates did not continue');
  return {visible:!document.hidden,keyboardSelection:true,saved,automaticLogReads:logReads,transportReads,selectionAfterRefresh:root.querySelector('.rl-selected')?.dataset.recordIndex};
 }finally{for(const restore of restores)restore();}
})()
