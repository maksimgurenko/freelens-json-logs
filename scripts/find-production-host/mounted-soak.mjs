import { evidence, scratch } from './config.mjs';
// Actual installed viewer + snapshots/Find/active-idle/teardown. No native input.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { driver, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { checkFrameCadence } from './frame-cadence.mjs';
import { listenerCensus } from './listener-census.mjs';
import { listenerHeap } from './listener-heap.mjs';
import { traceAbortListeners } from './listener-signals.mjs';
const cleanInspector=process.env.FIND_SOAK_INSPECTOR_CLEAN==='1';
const captureListeners=process.env.FIND_SOAK_LISTENERS==='1';
const captureHeap=process.env.FIND_SOAK_LISTENER_HEAPS==='1';
const noFind=process.env.FIND_SOAK_NO_FIND==='1';
const naturalFrames=process.env.FIND_SOAK_NATURAL_FRAMES==='1';
const measuredCycles=Number(process.env.FIND_SOAK_CYCLES??6);
assert(Number.isSafeInteger(measuredCycles)&&measuredCycles>=6&&measuredCycles<=120,'Expected 6–120 measured cycles');
const idleMs=Number(process.env.FIND_SOAK_IDLE_MS??0);
assert(Number.isSafeInteger(idleMs)&&idleMs>=0&&idleMs<=1000,'Expected 0–1000 idle milliseconds');
const integration=readFileSync(`${scratch}/integration-path`,'utf8');
const footprint=(path,hash=false)=>Object.fromEntries(readdirSync(path).flatMap(name=>{
  const next=join(path,name),stat=lstatSync(next);
  return stat.isDirectory()?Object.entries(footprint(next,hash)).map(([key,value])=>[name+'/'+key,value])
    :[[name,{bytes:stat.size,...hash?{sha256:createHash('sha256').update(readFileSync(next)).digest('hex')}:{}}]];
}));
const startedAt=Date.now();
const d=await driver(),result={session:privateSession(),samples:[],measuredCycles,idleMs,startedAt,noFind,limits:`Three warmups and ${measuredCycles} measured cycles per bound. ${naturalFrames?'Natural private-output frames; no screenshots.':'Background CDP screenshots drive frames.'} ${noFind?'Attribution control with Find unopened; not Find acceptance.':''} Native input cadence remains unverified.`};
let pumping=false;const pump=naturalFrames?null:setInterval(async()=>{if(pumping)return;pumping=true;try{await d.page.send('Page.captureScreenshot',{format:'png'});}catch{}finally{pumping=false;}},150);
let signalTrace;
const until=async(predicate)=>{for(let i=0;i<400;i++){if(await predicate())return;await sleep(25);}throw Error('Mounted soak did not settle');};
try {
  if(naturalFrames)result.frameCadence=await checkFrameCadence(d);
  await d.bind(d.cluster());
  if(process.env.FIND_SOAK_SIGNAL_TRACE==='1'){
    signalTrace=await traceAbortListeners(d.page);
    result.abortSignalTraceScope='Optional private diagnostic wraps addEventListener, never callbacks. Weak references report reachable signals/callbacks registered during this run, not whether a listener was subsequently removed. Bounded to 8,192 registrations per frame. Methods restored at teardown; timing is instrumented.';
  }
  const fixture=JSON.parse(readFileSync(`${evidence}/fixture.json`));
  const clusterId=await d.page.evaluate('global.LensExtensions.Renderer.Catalog.getActiveCluster().id',d.cluster());
  const params={namespace:fixture.namespace,pod:'find-fixtures',podUid:fixture.podUid,clusterId};
  for(const name of ['dense','long']){
    const samples=[];
    for(let cycle=-3;cycle<measuredCycles;cycle++){
      await d.page.evaluate("global.LensExtensions.Renderer.Navigation.navigate('/overview');true",d.cluster());await d.wait(s=>!s.live&&!s.service.owners);
      await d.page.evaluate(`global.__findRenderer.navigate('readable-logs',${JSON.stringify(params)});true`,d.cluster());
      await until(()=>d.page.evaluate('document.querySelectorAll(".rl-record").length===120',d.cluster()));
      await d.page.evaluate(`(()=>{const select=document.querySelector('select[aria-label="Container"]');select.value=${JSON.stringify(name)};select.dispatchEvent(new Event('change',{bubbles:true}));return true;})()`,d.cluster());
      await until(()=>d.page.evaluate(`document.querySelectorAll('.rl-record').length===${name==='dense'?1000:1}&&!document.querySelector('.rl-records[aria-busy="true"]')`,d.cluster()));
      const started=performance.now();
      const query=name==='dense'?'a':'Q';
      await d.page.evaluate(`(()=>{const root=document.querySelector('.readable-logs');const b=n=>[...root.querySelectorAll('button')].find(x=>x.textContent.trim()===n).click();b('Pause');if(!${noFind}){b('Find');const input=root.querySelector('#rl-find');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(query)});input.dispatchEvent(new Event('input',{bubbles:true}));}return true;})()`,d.cluster());
      if(!noFind)await until(()=>d.page.evaluate(`document.querySelector('.rl-find-count')?.textContent.endsWith('of ${name==='dense'?1000:1} matching records')`,d.cluster()));
      const matchObservedMs=noFind?null:performance.now()-started;
      if(name==='long')await d.page.evaluate(`(async()=>{const root=document.querySelector('.readable-logs');root.querySelector('.rl-display-options').open=true;[...root.querySelectorAll('.rl-display-panel label')].find(e=>e.textContent.includes('Word wrap')).querySelector('input').click();root.querySelector('.rl-display-options').open=false;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));[...root.querySelectorAll('button')].find(b=>b.textContent.trim()==='To bottom').click();return true;})()`,d.cluster());
      if(!noFind)await until(()=>d.page.evaluate('[...CSS.highlights].some(([,h])=>h.size>0)',d.cluster()));
      const active=await d.page.evaluate(`({rows:document.querySelectorAll('.rl-record').length,sourceUnits:[...document.querySelectorAll('.rl-message')].reduce((n,e)=>n+e.textContent.length,0),highlights:[...CSS.highlights].reduce((n,[,h])=>n+h.size,0),highlightStarts:[...CSS.highlights].flatMap(([,h])=>[...h].map(r=>Number(r.startContainer.parentElement.dataset.sourceStart)+r.startOffset)),marks:document.querySelectorAll('.rl-find-mark').length,status:document.querySelector('.rl-highlight-status')?.textContent,query:document.querySelector('#rl-find')?.value??null,findHidden:document.querySelector('#rl-findbar')?.hidden,paused:document.querySelector('.rl-update-status').textContent})`,d.cluster());
      if(noFind){assert.equal(active.highlights,0);assert.equal(active.marks,0);assert.equal(active.query,'');assert.equal(active.findHidden,true);}
      else{assert(active.highlights>0&&active.highlights<=1024);assert(active.marks>0);}
      assert.equal(active.paused,'Paused');
      if(!noFind&&name==='long')assert(active.highlightStarts.some(start=>start>active.sourceUnits-8192),'Long workload did not decorate late visible source');
      const stop=performance.now();await d.page.evaluate("global.LensExtensions.Renderer.Navigation.navigate('/extensions');true",d.root());
      await d.wait(s=>!s.live&&s.service.executions.every(e=>!e.active&&!e.running&&!e.pending&&!e.slot));const inactiveMs=performance.now()-stop;
      if(idleMs)await sleep(idleMs);
      assert.equal((await d.status()).live,0,'Inactive viewer restarted a worker');
      await d.page.evaluate(`global.LensExtensions.Renderer.Navigation.navigate('/cluster/'+${JSON.stringify(clusterId)});true`,d.root());
      await until(()=>d.page.evaluate(noFind?'!!document.querySelector(".readable-logs")':`document.querySelector('#rl-find')?.value===${JSON.stringify(query)}`,d.cluster()));
      assert.equal(await d.page.evaluate('document.querySelector(".rl-update-status").textContent',d.cluster()),'Paused');
      await d.page.evaluate("global.LensExtensions.Renderer.Navigation.navigate('/overview');true",d.cluster());await d.wait(s=>!s.live&&!s.service.owners&&!s.service.retiring);
      // Let native scroll/lifecycle queues drain after unmount before measuring
      // retained objects. The natural-frame precondition is checked above.
      if(naturalFrames)await d.page.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))',d.cluster());
      if(cleanInspector){await d.page.send('Runtime.discardConsoleEntries');await d.main.send('Runtime.discardConsoleEntries');}
      await d.main.send('HeapProfiler.collectGarbage');await d.page.send('HeapProfiler.collectGarbage');
      const cleanup=await d.page.evaluate('({highlights:CSS.highlights.size,rows:document.querySelectorAll(".rl-record").length,memory:process.memoryUsage(),pid:process.pid})',d.cluster());
      assert.equal(cleanup.highlights,0);assert.equal(cleanup.rows,0);
      const status=await d.status();assert.equal(status.starts,status.exits);assert.equal(status.service.senders,0);assert.equal(status.service.watch,false);
      const sample={at:Date.now(),cycle,matchObservedMs,inactiveMs,active,cleanup,main:await d.main.evaluate('process.memoryUsage()'),dom:await d.page.send('Memory.getDOMCounters'),threads:readdirSync(`/proc/${result.session.pid}/task`).length,rendererThreads:readdirSync(`/proc/${cleanup.pid}/task`).length,disk:footprint(integration),settings:footprint(join(integration,'Freelens/extension-store/freelens-readable-logs'),true),status};
      if(signalTrace)sample.abortSignals=await signalTrace.sample();
      if(cycle>=0){
        samples.push(sample);
        const earlier=samples.slice(0,-1).map(s=>s.dom.jsEventListeners);
        if((captureListeners||captureHeap) && (cycle===0 || cycle===measuredCycles-1 || sample.dom.jsEventListeners>Math.max(...earlier) || sample.dom.jsEventListeners<Math.min(...earlier))) {
          if(captureListeners)sample.listeners=await listenerCensus(d.page,`${name}-${cycle}`);
          if(captureHeap)sample.listenerHeap=await listenerHeap(d.page,`${name}-${cycle}`);
        }
      }
    }
    result.samples.push({name,warmupCycles:3,cycles:samples});console.log(JSON.stringify({name,cycles:samples.length}));
  }
  result.inspectorConsoleClearedBeforeGc=cleanInspector;
  result.lifecyclePass=true;
  result.sampleGrowth=result.samples.map(bound=>{
    const first=bound.cycles[0];
    assert(bound.cycles.every(sample=>JSON.stringify(sample.settings)===JSON.stringify(first.settings)),'Viewing changed extension settings/disk');
    return {name:bound.name,cycles:bound.cycles.map(sample=>({cycle:sample.cycle,
      nodes:sample.dom.nodes-first.dom.nodes,listeners:sample.dom.jsEventListeners-first.dom.jsEventListeners,documents:sample.dom.documents-first.dom.documents,
      mainThreads:sample.threads-first.threads,rendererThreads:sample.rendererThreads-first.rendererThreads,
      rendererHeap:sample.cleanup.memory.heapUsed-first.cleanup.memory.heapUsed,rendererRss:sample.cleanup.memory.rss-first.cleanup.memory.rss}))};
  });
  result.growth=result.sampleGrowth.map(bound=>({name:bound.name,...bound.cycles.at(-1)}));
  result.peakGrowth=result.sampleGrowth.map(bound=>({name:bound.name,...Object.fromEntries(
    ['nodes','listeners','documents','mainThreads','rendererThreads','rendererHeap','rendererRss'].map(metric=>[metric,Math.max(...bound.cycles.map(sample=>sample[metric]))]))}));
  // Same conservative retained-object limits as docs/resource-smoke.md. Failure
  // is an investigation gate, not attribution to extension vs host/inspector.
  const withinLimits=g=>g.nodes<=128&&g.listeners<=8&&g.documents<=0&&g.rendererHeap<=8*1024*1024;
  result.resourceViolations=result.sampleGrowth.flatMap(bound=>bound.cycles.filter(sample=>!withinLimits(sample)).map(sample=>({name:bound.name,...sample})));
  result.resourcePass=result.resourceViolations.length===0;
  result.elapsedMs=Date.now()-startedAt;
  result.pass=result.lifecyclePass&&result.resourcePass;
  if(!result.pass)process.exitCode=1;
}catch(error){result.error=error.stack;process.exitCode=1;}
finally{clearInterval(pump);try{if(signalTrace){await signalTrace.dispose();result.abortTraceRestored=true;}}finally{report(cleanInspector?'mounted-soak-clean-inspector':'mounted-soak',result);console.log(JSON.stringify({pass:result.pass,error:result.error}));d.close();}}
