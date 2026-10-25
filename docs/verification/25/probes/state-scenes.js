(async()=>{
 const h=global.__cv25,{assert,tick,root,click,state}=h;
 h.offline=true;await click('Refresh');for(let i=0;i<200&&!state().error;i++)await tick(10);assert(state().error,'Missing real socket failure');
 const error={message:root().querySelector('[role="alert"]').textContent,retained:state().snapshot.records.length,paused:state().paused};h.offline=false;
 h.sceneError=error;return error;
})()
