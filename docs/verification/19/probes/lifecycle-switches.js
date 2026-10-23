(async()=>{const h=global.__rl19,p=global.__rl13,{assert,root,state,button,click,input,tick}=h;for(let i=0;!state().snapshot&&i<500;i++)await tick(10);const results=[];
 const config=JSON.parse(require('fs').readFileSync(require('path').join(require('os').homedir(),'.config/Freelens/extension-store/freelens-readable-logs/readable-logs.json'),'utf8')),manual=config.profiles.find(p=>p.name==='Release19 primary').id;
 for(const container of ['sidecar','setup','debug','app']){
 if(button('Pause'))await click('Pause');await input('Profile',manual);const before=p.state(),selected=state().container;
 const el=root().querySelector('[aria-label="Container"]');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(el,container);el.dispatchEvent(new Event('change',{bubbles:true}));
 const immediate={rows:root().querySelectorAll('.rl-row').length,container:state().container,manual:state().manualProfile,paused:state().paused};assert(immediate.rows===0&&immediate.container===container&&!immediate.manual&&!immediate.paused,'Switch did not clear/reset '+container);
 for(let i=0;(!state().snapshot||state().refreshing)&&i<1000;i++)await tick(5);const after=p.state();assert(after.first.includes(container==='setup'?'init output':container==='debug'?'ephemeral output':container),'Wrong real container output');results.push({from:selected,to:container,before,immediate,after});}
 if(button('Pause'))await click('Pause');return {switches:results,requests:p.records,choices:p.state().choices};})()
