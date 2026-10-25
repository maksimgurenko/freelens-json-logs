(async()=>{
 const h=global.__rl19,{assert,root,tick,state,button,click}=h;
 assert(root()&&state().snapshot,'Need actual loaded viewer');
 const samples=[],start=performance.now(),measure=()=>{const work=root().querySelector('.rl-work').getBoundingClientRect(),records=root().querySelector('.rl-records').getBoundingClientRect();samples.push({ms:performance.now()-start,top:work.top,height:work.height,recordsHeight:records.height,notices:[...root().querySelectorAll('.rl-notice')].filter(e=>e.getBoundingClientRect().height>0).map(e=>e.textContent),rows:root().querySelectorAll('.rl-row').length});};
 measure();const observer=new MutationObserver(measure);observer.observe(root(),{childList:true,subtree:true,characterData:true});
 try{if(button('Resume'))await click('Resume');await tick(6500);if(button('Pause'))await click('Pause');await tick(100);}finally{observer.disconnect();}
 const bannerSamples=samples.filter(s=>s.notices.some(t=>t.includes('Reading log snapshot'))),topRange=Math.max(...samples.map(s=>s.top))-Math.min(...samples.map(s=>s.top)),heightRange=Math.max(...samples.map(s=>s.height))-Math.min(...samples.map(s=>s.height));
 h.flickerEvidence={version:root().dataset.version,host:global.LensExtensions.Common.Util.getAppVersion(),container:state().container,bannerSamples:bannerSamples.length,topRange,heightRange,samples};
 assert(bannerSamples.length===0&&topRange<.5&&heightRange<.5,`Refresh flicker: snapshot banner appeared in ${bannerSamples.length} observations; log area moved ${topRange}px and resized ${heightRange}px`);
 return h.flickerEvidence;
})()
