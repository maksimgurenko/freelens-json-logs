(() => {
 if(global.__rl13) throw Error('Probe already exists');
 const p={records:[],events:[],hold:false,denied:false,held:[],restore:()=>{}};
 const restores=[];
 for (const protocol of ['http','https']) {
  const module=require(protocol), original=module.request;
  module.request=function(...args) {
   const request=original.apply(this,args);
   if (/\/namespaces\/readable-logs-ticket-13\/pods\/lifecycle(?:\/log)?(?:\?|$)/.test(request.path)) {
    const log=request.path.includes('/log'), record={kind:log?'logs':'metadata',path:request.path,started:Date.now()};p.records.push(record);
    if(log && p.denied)request.setHeader('Impersonate-User','freelens-readable-logs-ticket-13-denied');
    request.on('response',response=>{
     record.status=response.statusCode;let body='';
     response.on('data',chunk=>{body+=chunk.toString();});
     response.on('end',()=>{
      record.settled=Date.now();record.bytes=Buffer.byteLength(body);
      if(log){record.first=body.slice(0,170);record.last=body.slice(-170);}
      else {try{const pod=JSON.parse(body);record.uid=pod.metadata?.uid;record.instances=[...(pod.status?.containerStatuses??[]),...(pod.status?.initContainerStatuses??[]),...(pod.status?.ephemeralContainerStatuses??[])].map(s=>({name:s.name,restarts:s.restartCount,id:s.containerID}));}catch{}}
     });
    });
    request.on('error',error=>{record.error=error.message;record.settled=Date.now();});
    const end=request.end;
    request.end=function(...endArgs){if(log && p.hold){p.held.push(()=>end.apply(request,endArgs));record.held=true;return request;}return end.apply(request,endArgs);};
   }
   return request;
  };
  restores.push(()=>{module.request=original;});
 }
 const visibility=()=>p.events.push({at:Date.now(),event:'visibility',hidden:document.hidden});
 const blur=()=>p.events.push({at:Date.now(),event:'blur',hidden:document.hidden});
 document.addEventListener('visibilitychange',visibility);window.addEventListener('blur',blur);
 p.restore=()=>{p.hold=false;for(const release of p.held.splice(0))release();for(const restore of restores)restore();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',blur);delete global.__rl13;};
 p.state=()=>{const e=document.querySelector('.readable-logs');return {at:Date.now(),url:location.href,hidden:document.hidden,focused:document.hasFocus(),version:e?.dataset.version,container:e?.querySelector('select')?.value,choices:[...e?.querySelectorAll('optgroup')??[]].map(g=>({kind:g.label,names:[...g.querySelectorAll('option')].map(o=>o.value)})),header:e?.innerText.split('\n').slice(0,20),error:e?.querySelector('[role=alert]')?.innerText,notice:[...e?.querySelectorAll('.rl-notice')??[]].map(n=>n.innerText),buttons:[...e?.querySelectorAll('button')??[]].map(b=>({text:b.textContent,disabled:b.disabled})),rows:e?.querySelectorAll('.rl-row').length,first:e?.querySelector('.rl-row')?.innerText,last:[...e?.querySelectorAll('.rl-row')??[]].at(-1)?.innerText};};
 p.click=text=>{const b=[...document.querySelectorAll('.readable-logs button')].find(b=>b.textContent===text);if(!b || b.disabled)throw Error('Unavailable '+text);b.click();};
 global.__rl13=p;return {installed:true,state:p.state()};
})()
