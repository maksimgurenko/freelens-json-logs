// Open/close churn on real continuously emitted logs; no Find or native input.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { driver, report, sleep } from './driver.mjs';
import { scratch } from './config.mjs';
import { privateSession } from './private-session.mjs';
import { checkFrameCadence } from './frame-cadence.mjs';

const viewer=process.env.FIND_COMPARE_VIEWER;
assert(['readable','default'].includes(viewer));
const measuredCycles=Number(process.env.FIND_COMPARE_CYCLES??100);
assert(Number.isSafeInteger(measuredCycles)&&measuredCycles>=1&&measuredCycles<=100);
const fixture=JSON.parse(readFileSync(`${scratch}/comparison-fixture.json`,'utf8'));
const d=await driver(),startedAt=Date.now();
const result={viewer,fixture,startedAt,measuredCycles,warmupCycles:3,dwellMs:500,postCloseIdleMs:250,find:'unopened; default search query empty',session:privateSession(),warmups:[],samples:[],thresholds:{nodes:128,listeners:8,documents:0,rendererHeap:8*1024*1024},scope:'Fresh installed private host/profile per viewer; natural private frames; first fully loaded fresh-sequence snapshot, 500 ms dwell, true unmount/close; 250 ms post-close idle, two natural frames, console discard, forced GC before every retained sample. Not a native-input or sustained-streaming benchmark.'};
const until=async(predicate,label)=>{const deadline=Date.now()+20000;while(Date.now()<deadline){const x=await predicate();if(x)return x;await sleep(25);}throw Error(`Timed out: ${label}`);};
const growth=(s,b)=>({nodes:s.dom.nodes-b.dom.nodes,listeners:s.dom.jsEventListeners-b.dom.jsEventListeners,documents:s.dom.documents-b.dom.documents,rendererHeap:s.renderer.memory.heapUsed-b.renderer.memory.heapUsed,rendererRss:s.renderer.memory.rss-b.renderer.memory.rss,mainHeap:s.main.heapUsed-b.main.heapUsed,mainRss:s.main.rss-b.main.rss,mainThreads:s.mainThreads-b.mainThreads,rendererThreads:s.rendererThreads-b.rendererThreads});
const within=g=>Object.entries(result.thresholds).every(([k,limit])=>g[k]<=limit);
// Read the stock view's existing React model afresh; return only plain values.
// No model, fiber, DOM root or remote CDP object is retained by the harness.
const stockModel=`(()=>{const el=document.querySelector('.PodLogs');if(!el)return null;const key=Object.keys(el).find(k=>k.startsWith('__reactFiber'));for(let f=el[key];f;f=f.return){if(f.memoizedProps?.model?.logs)return f.memoizedProps.model;}return null;})()`;
const activeExpression=viewer==='readable'?`(()=>{const root=document.querySelector('.readable-logs');if(!root)return null;const text=[...root.querySelectorAll('.rl-message')].map(e=>e.textContent);const seq=text.flatMap(t=>[...t.matchAll(/comparison sequence (\\d+)/g)].map(m=>Number(m[1])));return {rows:root.querySelectorAll('.rl-record').length,newest:Math.max(...seq),oldest:Math.min(...seq),busy:!!root.querySelector('.rl-records[aria-busy="true"]'),query:root.querySelector('#rl-find')?.value,findHidden:root.querySelector('#rl-findbar')?.hidden,highlights:CSS.highlights.size,paused:root.querySelector('.rl-update-status')?.textContent,renderedRows:root.querySelectorAll('.rl-record').length};})()`:`(()=>{const model=${stockModel};if(!model)return null;const logs=model.logs.get();const seq=logs.flatMap(t=>[...t.matchAll(/comparison sequence (\\d+)/g)].map(m=>Number(m[1])));return {rows:logs.length,newest:Math.max(...seq),oldest:Math.min(...seq),busy:model.isLoading.get(),query:model.searchStore.searchQuery,highlights:document.querySelectorAll('.PodLogs .overlay').length,renderedRows:document.querySelectorAll('.PodLogs .LogRow').length,tabData:model.logTabData.get()};})()`;
let previousSequence=-1,clusterId;
async function open(){
  const at=performance.now();
  if(viewer==='readable')await d.page.evaluate(`(async()=>{await global.__findRenderer.navigate('readable-logs',${JSON.stringify({namespace:fixture.namespace,pod:fixture.pod,podUid:fixture.podUid,clusterId})});return true;})()`,d.cluster());
  else await d.page.evaluate(`(async()=>{const R=global.LensExtensions.Renderer;const pod=R.K8sApi.podsStore.getById(${JSON.stringify(fixture.podUid)});if(!pod)throw Error('Fixture absent from Pod store');const id=R.Component.logTabStore.createPodTab({selectedPod:pod,selectedContainer:pod.spec.containers.find(c=>c.name===${JSON.stringify(fixture.container)})});global.__comparisonTabId=id;return id;})()`,d.cluster());
  const active=await until(async()=>{const s=await d.page.evaluate(activeExpression,d.cluster());return s&&!s.busy&&s.rows>0&&Number.isFinite(s.newest)&&s.newest>previousSequence?s:null;},'fully loaded fresh log snapshot');
  assert.equal(active.query,'');assert.equal(active.highlights,0);
  if(viewer==='readable'){assert.equal(active.findHidden,true);assert(!active.paused.startsWith('Paused'));}
  previousSequence=active.newest;
  return {at:Date.now(),readyMs:performance.now()-at,...active};
}
async function close(){
  if(viewer==='readable')await d.page.evaluate("global.LensExtensions.Renderer.Navigation.navigate('/overview');true",d.cluster());
  else await d.page.evaluate(`(()=>{const id=global.__comparisonTabId;const e=document.querySelector('[data-testid="dock-tab-close-for-'+id+'"]');if(!e)throw Error('Stock dock close control missing');e.click();if(global.LensExtensions.Renderer.Component.logTabStore.getData(id)!==undefined)throw Error('Stock tab data was not cleared');delete global.__comparisonTabId;return true;})()`,d.cluster());
  await until(()=>d.page.evaluate(`!document.querySelector('.readable-logs')&&!document.querySelector('.PodLogs')&&!document.querySelector('[data-testid^="dock-tab-for-log-tab-"]')`,d.cluster()),'viewer and tab disposed');
  await d.wait(s=>s.live===0&&s.service.owners===0&&s.service.opening===0&&s.service.retiring===0&&s.service.senders===0&&!s.service.watch);
}
async function sample(cycle,active){
  await sleep(result.postCloseIdleMs);
  await d.page.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))',d.cluster());
  await d.page.send('Runtime.discardConsoleEntries');await d.main.send('Runtime.discardConsoleEntries');
  await d.main.send('HeapProfiler.collectGarbage');await d.page.send('HeapProfiler.collectGarbage');
  const renderer=await d.page.evaluate('({pid:process.pid,memory:process.memoryUsage(),url:location.href,rows:document.querySelectorAll(".rl-record,.PodLogs .LogRow").length,highlights:CSS.highlights.size})',d.cluster());
  assert.equal(renderer.rows,0);assert.equal(renderer.highlights,0);
  const status=await d.status();assert.equal(status.starts,status.exits);
  return {cycle,at:Date.now(),active,renderer,main:await d.main.evaluate('process.memoryUsage()'),dom:await d.page.send('Memory.getDOMCounters'),status,mainThreads:readdirSync(`/proc/${result.session.pid}/task`).length,rendererThreads:readdirSync(`/proc/${renderer.pid}/task`).length};
}
try {
  await d.bind(d.cluster());
  result.frameCadence=await checkFrameCadence(d);
  clusterId=await d.page.evaluate('global.LensExtensions.Renderer.Catalog.getActiveCluster().id',d.cluster());
  // Equal setup for both treatments: preload the target Pod into the host store
  // once, before warmups. Stock logs use that store as their source of identity.
  result.podStore=await d.page.evaluate(`(async()=>{const R=global.LensExtensions.Renderer;await R.K8sApi.podsStore.loadAll({namespaces:[${JSON.stringify(fixture.namespace)}]});const pod=R.K8sApi.podsStore.getById(${JSON.stringify(fixture.podUid)});if(!pod)throw Error('Fixture missing from host store');return {uid:pod.getId(),namespace:pod.getNs(),name:pod.getName()};})()`,d.cluster());
  for(let cycle=-3;cycle<measuredCycles;cycle++){
    const active=await open();await sleep(result.dwellMs);await close();
    const s=await sample(cycle,active);
    if(cycle<0)result.warmups.push(s);else result.samples.push(s);
    if(cycle===-1)result.baseline=s;
    if(cycle>=0){s.growth=growth(s,result.baseline);s.withinLimits=within(s.growth);}
    if(cycle>=0&&(cycle%10===9||cycle===measuredCycles-1))console.log(JSON.stringify({viewer,completed:cycle+1,growth:s.growth}));
  }
  result.growth=result.samples.at(-1).growth;
  result.peakGrowth=Object.fromEntries(Object.keys(result.growth).map(k=>[k,Math.max(...result.samples.map(s=>s.growth[k]))]));
  result.violations=result.samples.filter(s=>!s.withinLimits).map(s=>({cycle:s.cycle,...s.growth}));
  result.resourcePass=result.violations.length===0;
  result.lifecyclePass=true;
  // Separate >=10s active control observes each view's real automatic updates.
  const initial=await open();await sleep(11000);
  const updated=await d.page.evaluate(activeExpression,d.cluster());
  result.activeGrowthControl={durationMs:11000,initial,updated,pass:updated.newest>initial.newest};
  assert(result.activeGrowthControl.pass,'Live log sequence did not advance automatically');
  assert.equal(updated.query,'');await close();
  result.afterActiveControl=await sample('after-active-control',updated);
  result.completed=true;
} catch(error){result.error=error.stack;process.exitCode=1;}
finally {
  result.elapsedMs=Date.now()-startedAt;
  result.pass=!!result.completed&&result.resourcePass;
  if(!result.pass)process.exitCode=1;
  report('comparison',result);
  console.log(JSON.stringify({viewer,pass:result.pass,completed:result.completed,resourcePass:result.resourcePass,violations:result.violations?.length,error:result.error,elapsedMs:result.elapsedMs}));
  d.close();
}
