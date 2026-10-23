(async () => {
 const p=global.__rl13, evidence={before:p.state(),switches:[]};
 const wait=async predicate=>{for(let i=0;i<100;i++){if(predicate())return;await new Promise(r=>setTimeout(r,50));}throw Error('State did not settle');};
 for(const name of ['sidecar','setup','debug','app']) {
  if(document.querySelector('.readable-logs button')?.textContent==='Pause')p.click('Pause');
  const before=p.state();
  const select=document.querySelector('.readable-logs select');
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(select,name);
  select.dispatchEvent(new Event('change',{bubbles:true}));
  const immediate=p.state();
  if(immediate.rows!==0 || immediate.container!==name || immediate.buttons[0].text!=='Pause')throw Error('Switch did not clear/reset');
  await wait(()=>p.state().rows>0 && !p.state().buttons[1].disabled);
  const after=p.state();
  if(!after.first.includes(name==='setup'?'init output':name==='debug'?'ephemeral output':name))throw Error('Wrong container data');
  evidence.switches.push({before,immediate,after});
 }
 evidence.requests=p.records;evidence.events=p.events;return evidence;
})()
