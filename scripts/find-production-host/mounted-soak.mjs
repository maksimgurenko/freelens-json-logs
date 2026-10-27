import { evidence } from './config.mjs';
// Actual installed viewer + snapshots/Find/active-idle/teardown. No native input.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { driver, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { checkFrameCadence } from './frame-cadence.mjs';
const cleanInspector=process.env.FIND_SOAK_INSPECTOR_CLEAN==='1';
const naturalFrames=process.env.FIND_SOAK_NATURAL_FRAMES==='1';
const d=await driver(),result={session:privateSession(),samples:[],limits:`Three warmups and six samples per bound. ${naturalFrames?'Natural private-output frames; no screenshots.':'Background CDP screenshots drive frames.'} Native input cadence remains unverified.`};
let pumping=false;const pump=naturalFrames?null:setInterval(async()=>{if(pumping)return;pumping=true;try{await d.page.send('Page.captureScreenshot',{format:'png'});}catch{}finally{pumping=false;}},150);
const until=async(predicate)=>{for(let i=0;i<400;i++){if(await predicate())return;await sleep(25);}throw Error('Mounted soak did not settle');};
try {
  if(naturalFrames)result.frameCadence=await checkFrameCadence(d);
  await d.bind(d.cluster());
  const fixture=JSON.parse(readFileSync(`${evidence}/fixture.json`));
  const clusterId=await d.page.evaluate('global.LensExtensions.Renderer.Catalog.getActiveCluster().id',d.cluster());
  const params={namespace:fixture.namespace,pod:'find-fixtures',podUid:fixture.podUid,clusterId};
  for(const name of ['dense','long']){
    const samples=[];
    for(let cycle=-3;cycle<6;cycle++){
      await d.page.evaluate("global.LensExtensions.Renderer.Navigation.navigate('/overview');true",d.cluster());await d.wait(s=>!s.live&&!s.service.owners);
      await d.page.evaluate(`global.__findRenderer.navigate('readable-logs',${JSON.stringify(params)});true`,d.cluster());
      await until(()=>d.page.evaluate('document.querySelectorAll(".rl-record").length===120',d.cluster()));
      await d.page.evaluate(`(()=>{const select=document.querySelector('select[aria-label="Container"]');select.value=${JSON.stringify(name)};select.dispatchEvent(new Event('change',{bubbles:true}));return true;})()`,d.cluster());
      await until(()=>d.page.evaluate(`document.querySelectorAll('.rl-record').length===${name==='dense'?1000:1}&&!document.querySelector('.rl-records[aria-busy="true"]')`,d.cluster()));
      const started=performance.now();
      const query=name==='dense'?'a':'Q';
      await d.page.evaluate(`(()=>{const root=document.querySelector('.readable-logs');const b=n=>[...root.querySelectorAll('button')].find(x=>x.textContent.trim()===n).click();b('Pause');b('Find');const input=root.querySelector('#rl-find');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(query)});input.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`,d.cluster());
      await until(()=>d.page.evaluate(`document.querySelector('.rl-find-count')?.textContent.endsWith('of ${name==='dense'?1000:1} matching records')`,d.cluster()));
      const matchObservedMs=performance.now()-started;
      if(name==='long')await d.page.evaluate(`(async()=>{const root=document.querySelector('.readable-logs');root.querySelector('.rl-display-options').open=true;[...root.querySelectorAll('.rl-display-panel label')].find(e=>e.textContent.includes('Word wrap')).querySelector('input').click();root.querySelector('.rl-display-options').open=false;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));[...root.querySelectorAll('button')].find(b=>b.textContent.trim()==='To bottom').click();return true;})()`,d.cluster());
      await until(()=>d.page.evaluate('[...CSS.highlights].some(([,h])=>h.size>0)',d.cluster()));
      const active=await d.page.evaluate(`({rows:document.querySelectorAll('.rl-record').length,sourceUnits:[...document.querySelectorAll('.rl-message')].reduce((n,e)=>n+e.textContent.length,0),highlights:[...CSS.highlights].reduce((n,[,h])=>n+h.size,0),highlightStarts:[...CSS.highlights].flatMap(([,h])=>[...h].map(r=>Number(r.startContainer.parentElement.dataset.sourceStart)+r.startOffset)),marks:document.querySelectorAll('.rl-find-mark').length,status:document.querySelector('.rl-highlight-status')?.textContent,query:document.querySelector('#rl-find').value,paused:document.querySelector('.rl-update-status').textContent})`,d.cluster());
      assert(active.highlights>0&&active.highlights<=1024);assert(active.marks>0);assert.equal(active.paused,'Paused');
      if(name==='long')assert(active.highlightStarts.some(start=>start>active.sourceUnits-8192),'Long workload did not decorate late visible source');
      const stop=performance.now();await d.page.evaluate("global.LensExtensions.Renderer.Navigation.navigate('/extensions');true",d.root());
      await d.wait(s=>!s.live&&s.service.executions.every(e=>!e.active&&!e.running&&!e.pending&&!e.slot));const inactiveMs=performance.now()-stop;
      await d.page.evaluate(`global.LensExtensions.Renderer.Navigation.navigate('/cluster/'+${JSON.stringify(clusterId)});true`,d.root());
      await until(()=>d.page.evaluate(`document.querySelector('#rl-find')?.value===${JSON.stringify(query)}`,d.cluster()));
      assert.equal(await d.page.evaluate('document.querySelector(".rl-update-status").textContent',d.cluster()),'Paused');
      await d.page.evaluate("global.LensExtensions.Renderer.Navigation.navigate('/overview');true",d.cluster());await d.wait(s=>!s.live&&!s.service.owners&&!s.service.retiring);
      // Let native scroll/lifecycle queues drain after unmount before measuring
      // retained objects. The natural-frame precondition is checked above.
      if(naturalFrames)await d.page.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))',d.cluster());
      if(cleanInspector){await d.page.send('Runtime.discardConsoleEntries');await d.main.send('Runtime.discardConsoleEntries');}
      await d.main.send('HeapProfiler.collectGarbage');await d.page.send('HeapProfiler.collectGarbage');
      const cleanup=await d.page.evaluate('({highlights:CSS.highlights.size,rows:document.querySelectorAll(".rl-record").length,memory:process.memoryUsage()})',d.cluster());
      assert.equal(cleanup.highlights,0);assert.equal(cleanup.rows,0);
      const status=await d.status();assert.equal(status.starts,status.exits);assert.equal(status.service.senders,0);assert.equal(status.service.watch,false);
      const sample={cycle,matchObservedMs,inactiveMs,active,cleanup,main:await d.main.evaluate('process.memoryUsage()'),dom:await d.page.send('Memory.getDOMCounters'),threads:readdirSync(`/proc/${result.session.pid}/task`).length,status};
      if(cycle>=0)samples.push(sample);
    }
    result.samples.push({name,warmupCycles:3,cycles:samples});console.log(JSON.stringify({name,cycles:samples.length}));
  }
  result.inspectorConsoleClearedBeforeGc=cleanInspector;
  result.lifecyclePass=true;
  result.growth=result.samples.map(bound=>{
    const first=bound.cycles[0],last=bound.cycles.at(-1);
    return {name:bound.name,nodes:last.dom.nodes-first.dom.nodes,listeners:last.dom.jsEventListeners-first.dom.jsEventListeners,
      rendererHeap:last.cleanup.memory.heapUsed-first.cleanup.memory.heapUsed,rendererRss:last.cleanup.memory.rss-first.cleanup.memory.rss};
  });
  // Same conservative retained-object limits as docs/resource-smoke.md. Failure
  // is an investigation gate, not attribution to extension vs host/inspector.
  result.resourcePass=result.growth.every(g=>g.nodes<=128&&g.listeners<=8&&g.rendererHeap<=8*1024*1024);
  result.pass=result.lifecyclePass&&result.resourcePass;
  if(!result.pass)process.exitCode=1;
}catch(error){result.error=error.stack;process.exitCode=1;}
finally{clearInterval(pump);report(cleanInspector?'mounted-soak-clean-inspector':'mounted-soak',result);console.log(JSON.stringify({pass:result.pass,error:result.error}));d.close();}
