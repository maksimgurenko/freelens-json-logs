(async()=>{const h=global.__rl19,{assert,root,state,button,click,tick,requests}=h;const mode='denied';
 if(state().container!=='bounded'){await h.input('Container','bounded');for(let i=0;(!state().snapshot||state().refreshing)&&i<2000;i++)await tick(2);if(button('Pause'))await click('Pause');}
 const digest=()=>require('crypto').createHash('sha256').update(JSON.stringify(state().snapshot.records.map(r=>r.transportLine))).digest('hex');const original=digest(),before=requests.length;
 h[mode]=true;await click('Resume');for(let i=0;!state().error&&i<1000;i++)await tick(5);
 assert(state().error&&state().outdated&&digest()===original&&root().innerText.includes('Logs are outdated'),'Failed read did not retain outdated originals');
 const failure={error:state().error,request:h.summary(requests.at(-1)),body:mode==='denied'?requests.at(-1).body:undefined,digest:digest()};
 if(mode==='denied')assert(requests.at(-1).status===403&&JSON.parse(requests.at(-1).body).reason==='Forbidden'&&requests.at(-1).body.includes('pods/log'),'Not real access denial');else assert(requests.at(-1).error.includes('ECONNREFUSED'),'Not real socket failure');
 await tick(3300);assert(requests.length===before+1,'Automatic retry loop after failure');
 await click('Retry');for(let i=0;state().refreshing&&i<1000;i++)await tick(5);assert(requests.length===before+2&&state().error,'Explicit failed Retry missing');await tick(3300);assert(requests.length===before+2,'Failed Retry loop');
 h[mode]=false;await click('Retry');for(let i=0;(state().error||state().refreshing)&&i<1000;i++)await tick(5);assert(!state().error&&!state().outdated&&!state().paused,'Explicit recovery failed');
 const recovery=h.summary(requests.at(-1));await tick(3300);assert(requests.length===before+4,'Automatic updates did not resume after recovery');await click('Pause');
 return {mode,version:root().dataset.version,failure,recovery,retainedOriginalSha256:original,noAutomaticFailureLoop:true,failedExplicitRetryOnce:true,successfulExplicitRetryResumes:true,requests:requests.slice(before).map(h.summary)};
})()
