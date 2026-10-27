// Bounded attribution control for installed-host post-unmount resource samples.
// No native input, screenshot pump, clipboard, or extension/settings writes.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { driver, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { evidence } from './config.mjs';
const d=await driver(),result={session:privateSession(),samples:[],scope:'Fifteen cycles per control in the already-used private host. Attribution diagnostic, not a fresh-process soak or native latency acceptance.'};
const evaluate=code=>d.page.evaluate(code,d.cluster());
try{
  await d.bind(d.cluster());
  const fixture=JSON.parse(readFileSync(`${evidence}/fixture.json`));
  const clusterId=await evaluate('LensExtensions.Renderer.Catalog.getActiveCluster().id');
  const params={namespace:fixture.namespace,pod:'find-fixtures',podUid:fixture.podUid,clusterId};
  await evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');true");
  await d.wait(s=>!s.live&&!s.service.owners);
  for(const scenario of ['stationary','host-route','viewer-no-find','viewer-find','viewer-find-idle']){
    const samples=[];
    for(let cycle=-3;cycle<15;cycle++){
      if(scenario==='host-route')await evaluate("LensExtensions.Renderer.Navigation.navigate('/nodes');true");
      if(scenario.startsWith('viewer-')){
        await evaluate(`__findRenderer.navigate('readable-logs',${JSON.stringify(params)});true`);
        for(let i=0;i<300;i++){
          if(await evaluate('document.querySelectorAll(".rl-record").length===120'))break;
          assert(i<299,'Viewer snapshot did not settle');await sleep(20);
        }
      }
      if(scenario==='viewer-find'||scenario==='viewer-find-idle'){
        await evaluate(`(()=>{const b=n=>[...document.querySelectorAll('.readable-logs button')].find(x=>x.textContent.trim()===n).click();b('Pause');b('Find');const e=document.querySelector('#rl-find');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'upstream');e.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
        for(let i=0;i<300;i++){if(await evaluate('document.querySelector(".rl-find-count")?.textContent==="1 of 4 matching records"'))break;assert(i<299,'Find did not settle');await sleep(20);}
      }
      if(scenario==='viewer-find-idle'){
        await d.page.evaluate("LensExtensions.Renderer.Navigation.navigate('/extensions');true",d.root());await d.wait(s=>!s.live);
        await d.page.evaluate(`LensExtensions.Renderer.Navigation.navigate('/cluster/'+${JSON.stringify(clusterId)});true`,d.root());
        for(let i=0;i<300;i++){if(await evaluate('document.querySelector("#rl-find")?.value==="upstream"'))break;assert(i<299,'Find return did not settle');await sleep(20);}
      }
      await sleep(100);
      if(scenario!=='stationary')await evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');true");
      await d.wait(s=>!s.live&&!s.service.owners&&!s.service.retiring);
      await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
      await d.page.send('Runtime.discardConsoleEntries');await d.page.send('HeapProfiler.collectGarbage');
      const sample={cycle,dom:await d.page.send('Memory.getDOMCounters'),memory:await evaluate('process.memoryUsage()'),status:await d.status()};
      assert.equal(sample.status.service.senders,0);assert.equal(sample.status.service.watch,false);
      if(cycle>=0)samples.push(sample);
    }
    const first=samples[0],last=samples.at(-1);
    const growth={nodes:last.dom.nodes-first.dom.nodes,listeners:last.dom.jsEventListeners-first.dom.jsEventListeners,heap:last.memory.heapUsed-first.memory.heapUsed};
    result.samples.push({scenario,cycles:samples,growth});console.log(JSON.stringify({scenario,growth}));
  }
  result.completed=true;
}catch(error){result.error=error.stack;process.exitCode=1;}
finally{report('navigation-control',result);console.log(JSON.stringify({completed:result.completed,error:result.error}));d.close();}
