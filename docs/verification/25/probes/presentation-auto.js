(async()=>{const h=global.__cv25,{root,assert,tick,click,state}=h;
 if(h.button('Resume'))await click('Resume');for(let i=0;i<200&&state().refreshing;i++)await tick(10);
 const reads=h.requests.length;await h.display();root().querySelector('.rl-target-context summary').click();root().querySelectorAll('.rl-row')[20].click();await tick(3300);
 assert(!state().paused&&h.requests.length>reads,'Presentation implicitly paused');
 const details=root().querySelector('.rl-identity').textContent;assert(details.includes('Cluster ID')&&details.includes('Pod UID')&&details.includes(state().target.podUid),'Technical identity missing');
 const result={automaticWhileControlsOpen:!state().paused,logReads:h.requests.length-reads,identity:details};root().querySelector('.rl-target-context summary').click();await h.display(false);await click('Pause');return result;
})()
