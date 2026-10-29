import { scratch, evidence, ticket } from './config.mjs';
import { connect } from './cdp.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export async function driver() {
  const main = await connect(9242), page = await connect(9241);
  const integration = readFileSync(`${scratch}/integration-path`, 'utf8');
  assert.equal(await main.evaluate('process.env.FREELENS_INTEGRATION_TESTING_DIR'), integration);
  const bindMain = async () => {
    const proto = await main.send('Runtime.evaluate', { expression: 'global.__findProductionPrototype', objectGroup: 'find-host-bind' });
    const objects = await main.send('Runtime.queryObjects', { prototypeObjectId: proto.result.objectId, objectGroup: 'find-host-bind' });
    await main.send('Runtime.callFunctionOn', { objectId: objects.objects.objectId,
      functionDeclaration: 'function(){global.__findMain=this.find(x=>x.find);}', returnByValue: true });
    await main.send('Runtime.releaseObjectGroup', { objectGroup: 'find-host-bind' });
  };
  await bindMain();
  const entry = `${integration}/Freelens/node_modules/freelens-readable-logs/out/renderer-0.1.34.js`;
  const root = () => [...page.contexts.values()].find(c => c.auxData?.isDefault && /^https:\/\/renderer\./.test(c.origin));
  const cluster = () => [...page.contexts.values()].find(c => c.auxData?.isDefault && /^https:\/\/[^.]+\.renderer\./.test(c.origin));
  const bind = async context => {
    assert(context, 'Real renderer context required');
    for (let i = 0; i < 200; i++) {
      const proto = await page.send('Runtime.evaluate', { expression: `require(${JSON.stringify(entry)}).default.prototype`, contextId: context.id, objectGroup: 'find-host-bind' });
      if (proto.result.objectId) {
        const objects = await page.send('Runtime.queryObjects', { prototypeObjectId: proto.result.objectId, objectGroup: 'find-host-bind' });
        const result = await page.send('Runtime.callFunctionOn', { objectId: objects.objects.objectId,
          functionDeclaration: 'function(){global.__findRenderer=this.find(x=>x.isEnabled&&x.findRpc);if(!global.__findRenderer)return null;global.__findSdk=global.__findRenderer.findRpc;return {id:global.__findRenderer.id,url:location.href};}', returnByValue: true });
        await page.send('Runtime.releaseObjectGroup', { objectGroup: 'find-host-bind' });
        if (result.result?.value) return result.result.value;
      }
      await sleep(25); // Observe actual activation readiness, never retry a search.
    }
    throw Error('Production renderer did not activate in the real frame');
  };
  const rpc = (context, channel, ...args) => page.evaluate(`global.__findSdk.invoke(${JSON.stringify(channel)},...${JSON.stringify(args)})`, context);
  const status = () => main.evaluate(`(()=>{const f=global.__findMain.find;return {...global.__findObserve.snapshot(),service:f?{owners:f.owners.size,retiring:f.retiring.size,opening:f.opening.size,senders:f.senders.size,watch:!!f.stopWatch,executions:[...f.owners.values()].map(o=>({viewer:o.viewer,sender:o.sender.id,processId:o.processId,routingId:o.routingId,active:o.execution.active,running:!!o.execution.running,pending:!!o.execution.pending,slot:!!o.execution.slot,ready:o.execution.slot?.ready,stopping:o.execution.slot?.stopping}))}:null};})()`);
  const wait = async predicate => {
    for (let i = 0; i < 350; i++) { const value = await status(); if (predicate(value)) return value; await sleep(10); }
    throw Error('Lifecycle did not settle: ' + JSON.stringify(await status()));
  };
  return { main, page, root, cluster, bind, bindMain, rpc, status, wait, close() { main.close(); page.close(); } };
}

export const request = (requestId, text = 'σ', records = [{ ref: { context: 'host-42', occurrence: 0 }, application: '\u0345Σ\u0345', message: 'Σ' }], flags = {}) => ({
  requestId, key: { viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1, windowRevision: 1, messageRevision: 1, queryRevision: requestId },
  query: { text, matchCase: false, wholeWords: true, ...flags }, records, work: 'match',
});
export function report(name, value) { writeFileSync(`${evidence}/${name}.json`, JSON.stringify(value, null, 2) + '\n'); }

export async function installPackage(page, context) {
  return page.evaluate(`(async()=>{
    if(document.body.innerText.includes('more_vert'))throw Error('Expected no installed extensions');
    const input=document.querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'/home/max/work/freelens-json-logs/dist/freelens-readable-logs-0.1.34.tgz');input.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,50));
    [...document.querySelectorAll('button')].find(e=>e.innerText==='Install').click();
    for(let i=0;i<400;i++){if(document.body.innerText.includes('Enabled'))return document.body.innerText;await new Promise(r=>setTimeout(r,50));}
    throw Error('Single package installation failed');
  })()`, context);
}
