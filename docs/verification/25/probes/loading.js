(async()=>{
 const h=global.__cv25,{assert,tick,click,state,root}=h,restores=[],held=[];
 const before=state().snapshot,geometry=()=>{const r=root().querySelector('.rl-work').getBoundingClientRect();return {top:r.top,height:r.height};};const initial=geometry();
 try{
  for(const protocol of ['http','https']){const mod=require(protocol),original=mod.request;mod.request=function(...args){const request=original.apply(this,args);if(request.path.includes('/namespaces/readable-logs-ticket-25/')&&request.path.includes('/log?')&&request.path.includes('tailLines=1000')){const end=request.end;request.end=function(...endArgs){held.push(()=>end.apply(request,endArgs));return request;};}return request;};restores.push(()=>mod.request=original);}
  await click('Refresh');await tick(100);assert(held.length===1&&state().refreshing,'No held real request');
  const status=root().querySelector('.rl-update-status').textContent,loadingGeometry=geometry();
  assert(root().querySelector('.rl-records').getAttribute('aria-busy')==='true','Missing accessible busy');assert(![...root().querySelectorAll('.rl-notice')].some(n=>/Reading.*snapshot/.test(n.textContent)),'Routine banner present');
  assert(initial.top===loadingGeometry.top&&initial.height===loadingGeometry.height,'Loading moved log area');h.loadingEvidence={status,heldRealRequests:held.length,retainedSameSnapshot:state().snapshot===before,initial,loadingGeometry};
 }finally{for(const restore of restores)restore();for(const release of held)release();}
 await h.settled(before);assert(state().paused,'Paused Refresh resumed');return h.loadingEvidence;
})()
