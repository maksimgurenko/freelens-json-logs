// Minimize installed-host detached-view retention without screenshot/native input.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { driver, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { evidence } from './config.mjs';
const d=await driver(), result={session:privateSession(),samples:[],scope:'Installed traces viewer, no screenshots/native input; three cycles per controlled scenario, post-GC counters. Not a full resource soak.'};
const until=async(fn)=>{for(let i=0;i<300;i++){if(await fn())return;await sleep(20);}throw Error('Control did not settle');};
try{
 await d.bind(d.cluster());
 const fixture=JSON.parse(readFileSync(`${evidence}/fixture.json`));
 const clusterId=await d.page.evaluate('global.LensExtensions.Renderer.Catalog.getActiveCluster().id',d.cluster());
 const params={namespace:fixture.namespace,pod:'find-fixtures',podUid:fixture.podUid,clusterId};
 for(const scenario of ['mount','find','inactive'])for(let cycle=0;cycle<3;cycle++){
  await d.page.evaluate(`global.__findRenderer.navigate('readable-logs',${JSON.stringify(params)});true`,d.cluster());
  await until(()=>d.page.evaluate('document.querySelectorAll(".rl-record").length===120',d.cluster()));
  await d.page.evaluate(`(()=>{const b=n=>[...document.querySelectorAll('.readable-logs button')].find(x=>x.textContent.trim()===n).click();b('Pause');return true})()`,d.cluster());
  if(scenario!=='mount'){
   await d.page.evaluate(`(()=>{[...document.querySelectorAll('.readable-logs button')].find(x=>x.textContent.trim()==='Find').click();const input=document.querySelector('#rl-find');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'upstream');input.dispatchEvent(new Event('input',{bubbles:true}));return true})()`,d.cluster());
   await until(()=>d.page.evaluate("document.querySelector('.rl-find-count')?.textContent==='1 of 4 matching records'",d.cluster()));
  }
  if(scenario==='inactive'){
   await d.page.evaluate("global.LensExtensions.Renderer.Navigation.navigate('/extensions');true",d.root());await d.wait(s=>!s.live);
   await d.page.evaluate(`global.LensExtensions.Renderer.Navigation.navigate('/cluster/'+${JSON.stringify(clusterId)});true`,d.root());
   await until(()=>d.page.evaluate("document.querySelector('#rl-find')?.value==='upstream'",d.cluster()));
  }
  await d.page.evaluate("global.LensExtensions.Renderer.Navigation.navigate('/overview');true",d.cluster());await d.wait(s=>!s.live&&!s.service.owners);
  await sleep(200);await d.page.send('Runtime.discardConsoleEntries');await d.page.send('HeapProfiler.collectGarbage');
  const sample={scenario,cycle,dom:await d.page.send('Memory.getDOMCounters'),memory:await d.page.evaluate('process.memoryUsage()',d.cluster()),status:await d.status()};
  assert.equal(sample.status.service.senders,0);result.samples.push(sample);console.log(JSON.stringify({scenario,cycle,dom:sample.dom}));
 }
 result.completed=true;result.growth=['mount','find','inactive'].map(scenario=>{const samples=result.samples.filter(s=>s.scenario===scenario),a=samples[0],b=samples.at(-1);return{scenario,nodes:b.dom.nodes-a.dom.nodes,listeners:b.dom.jsEventListeners-a.dom.jsEventListeners}});
 result.resourcePass=result.growth.every(g=>g.nodes<=128&&g.listeners<=8);result.pass=result.resourcePass;if(!result.pass)process.exitCode=1;
}catch(error){result.error=error.stack;process.exitCode=1;}finally{report('retention-controls',result);console.log(JSON.stringify({pass:result.pass,error:result.error}));d.close()}
