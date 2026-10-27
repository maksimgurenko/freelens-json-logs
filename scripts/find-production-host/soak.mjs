// Installed packed worker via real SDK, at real retained Kubernetes log bounds.
// This measures SDK/worker lifecycle resources, not physical input or DOM latency.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { driver, request, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { scratch } from './config.mjs';
import { retainSnapshot } from '../../src/core/snapshot.ts';
const d=await driver(), result={session:privateSession(),samples:[],limits:'Short 20-cycle samples per bound; SDK/worker resources only, not long-duration or mounted DOM/input responsiveness.'};
const integration=readFileSync(`${scratch}/integration-path`,'utf8');
const footprint=path=>{let bytes=0,files=0;for(const name of readdirSync(path)){const next=path+'/'+name,stat=lstatSync(next);if(stat.isDirectory()){const x=footprint(next);bytes+=x.bytes;files+=x.files;}else{bytes+=stat.size;files++;}}return{bytes,files};};
try {
  await d.bind(d.root());
  await d.page.evaluate("global.LensExtensions.Renderer.Navigation.navigate('/overview');true",d.cluster());
  await d.wait(s=>!s.live&&!s.service.owners);
  const ns=JSON.parse(readFileSync(`${scratch}/fixture.json`)).namespace;
  const sample=async()=>{
    await d.main.send('HeapProfiler.collectGarbage');await d.page.send('HeapProfiler.collectGarbage');
    return {at:Date.now(),main:await d.main.evaluate('process.memoryUsage()'),renderer:await d.page.evaluate('process.memoryUsage()',d.root()),dom:await d.page.send('Memory.getDOMCounters'),threads:readdirSync(`/proc/${result.session.pid}/task`).length,disk:footprint(integration),status:await d.status()};
  };
  for(const name of ['dense','long']) {
    const transport=execFileSync('kubectl',['--context','kind-freelens-json-logs-spike','-n',ns,'logs','find-fixtures','-c',name,'--timestamps=true','--tail=1000'],{encoding:'utf8',maxBuffer:12*1024*1024});
    const retained=retainSnapshot(transport), records=retained.records.map((r,occurrence)=>({ref:{context:`soak-48-${name}`,occurrence},application:r.applicationText}));
    assert.equal(records.length,name==='dense'?1000:1);assert(retained.retainedBytes<=5*1024*1024);assert(retained.retainedBytes>4*1024*1024);
    const runs=[];
    for(let cycle=-3;cycle<20;cycle++) {
      const token=await d.rpc(d.root(),'find-open',`soak-${name}`);
      const started=performance.now();const reply=await d.rpc(d.root(),'find-request',token,request(1,name==='dense'?'a':'Q',records,{wholeWords:false}));const sdkMatchMs=performance.now()-started;
      assert.equal(reply.kind,'matches');assert.equal(reply.records.length,records.length);
      const decoration=request(2,name==='dense'?'a':'Q',records,{wholeWords:false});decoration.work='ranges';decoration.rangeInterest={id:1,scopes:records.slice(-1).map(r=>({ref:r.ref,source:'application',start:Math.max(0,r.application.length-10000),end:r.application.length}))};
      const ranges=await d.rpc(d.root(),'find-request',token,decoration);assert.equal(ranges.kind,'ranges');assert(ranges.ranges.length>0&&ranges.ranges.length<=4096);
      const stop=performance.now();await d.rpc(d.root(),'find-control',token,'active',false);const stopToControlMs=performance.now()-stop;
      const idle=await d.status();assert.equal(idle.live,0);assert(idle.service.executions.every(e=>!e.running&&!e.pending&&!e.slot));
      await sleep(50);await d.rpc(d.root(),'find-control',token,'active',true);assert.equal((await d.status()).live,0);
      assert.equal((await d.rpc(d.root(),'find-request',token,request(3,'Q',records,{wholeWords:false}))).kind,'matches');
      await d.rpc(d.root(),'find-control',token,'close');await d.wait(s=>!s.live&&!s.service.owners&&!s.service.retiring);
      const value=await sample();assert.equal(value.status.service.senders,0);assert.equal(value.status.service.watch,false);assert.equal(value.status.starts,value.status.exits);
      if(cycle>=0)runs.push({cycle,sdkMatchMs,stopToControlMs,...value});
    }
    result.samples.push({name,records:records.length,retainedBytes:retained.retainedBytes,warmupCycles:3,cycles:runs});
    console.log(JSON.stringify({bound:name,cycles:runs.length,mainRssGrowth:runs.at(-1).main.rss-runs[0].main.rss,threads:[runs[0].threads,runs.at(-1).threads]}));
  }
  result.final=await d.status();result.pass=true;
}catch(error){result.error=error.stack;process.exitCode=1;}
finally{report('installed-sdk-soak',result);console.log(JSON.stringify({pass:result.pass,error:result.error}));d.close();}
