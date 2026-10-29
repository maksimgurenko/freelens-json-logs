import assert from 'node:assert/strict';
import { driver, request, report, sleep, installPackage } from './driver.mjs';
const d = await driver(), evidence = { steps: [] };
const timer = setTimeout(() => { d.close(); process.exit(2); }, 55_000);
const menu = async title => d.page.evaluate(`(async()=>{
  let item=[...document.querySelectorAll('.MenuItem')].find(e=>e.querySelector('.title')?.textContent===${JSON.stringify(title)});
  if(!item){[...document.querySelectorAll('.Icon')].find(x=>x.textContent.trim()==='more_vert').click();await new Promise(r=>setTimeout(r,30));item=[...document.querySelectorAll('.MenuItem')].find(e=>e.querySelector('.title')?.textContent===${JSON.stringify(title)});}
  if(!item)throw Error('Missing package menu item');item.click();return true;
})()`, d.root());
const captureOld = () => d.main.evaluate('global.__findOldService=global.__findMain.find;true');
const clean = async () => {
  await d.wait(s => s.live === 0 && s.handlers.length === 0);
  const result = await d.main.evaluate(`({snapshot:global.__findObserve.snapshot(),old:{closed:global.__findOldService.closed,owners:global.__findOldService.owners.size,retiring:global.__findOldService.retiring.size,opening:global.__findOldService.opening.size,senders:global.__findOldService.senders.size,watch:!!global.__findOldService.stopWatch}})`);
  assert.deepEqual(result.old, { closed: true, owners: 0, retiring: 0, opening: 0, senders: 0, watch: false });
  assert.equal(result.snapshot.beforeQuit, 0);
  return result;
};
try {
  assert(!d.cluster(), 'Maintenance requires a fresh main window before any cluster');
  await d.page.evaluate(`global.LensExtensions.Renderer.Navigation.navigate('/extensions');true`, d.root());
  await sleep(200);
  evidence.freshMain = await d.status();
  assert(evidence.freshMain.windows.every(w => w.frames.length === 1));
  await d.bind(d.root());
  const token = await d.rpc(d.root(), 'find-open', 'disable-startup');
  await captureOld();
  await d.main.send('NodeWorker.enable', { waitForDebuggerOnStart: true });
  await d.page.evaluate(`global.__job=global.__findSdk.invoke('find-request',${JSON.stringify(token)},${JSON.stringify(request(1))});global.__job.catch(()=>{});true`, d.root());
  const before = await d.wait(s => s.live === 1 && s.service.executions.some(e => e.running && !e.ready));
  await menu('Disable');
  await d.main.send('NodeWorker.disable');
  const after = await clean();
  await assert.rejects(d.rpc(d.root(), 'find-open', 'disabled'), /No handler registered/);
  evidence.steps.push({ name: 'actual Disable during paused worker startup', before, after });
  await menu('Enabled');
  await d.wait(s => s.handlers.length === 3);
  await d.bindMain();
  await d.bind(d.root());
  const enabled = await d.rpc(d.root(), 'find-open', 'reenabled');
  assert.equal((await d.rpc(d.root(), 'find-request', enabled, request(1))).kind, 'matches');
  await captureOld();
  const idle = await d.status();
  assert.equal(idle.live, 1); assert.equal(idle.service.executions[0].running, false);
  await menu('Uninstall');
  await d.page.evaluate(`(()=>{const button=[...document.querySelectorAll('button')].find(x=>x.innerText==='Yes');if(!button)throw Error('Uninstall confirmation missing');button.click();return true;})()`, d.root());
  const removed = await clean();
  await assert.rejects(d.rpc(d.root(), 'find-open', 'removed'), /No handler registered/);
  evidence.steps.push({ name: 'reactivation and actual Uninstall with idle worker', idle, removed });
  // The package was installed through the form initially; this is one clean
  // single-submission reinstall, retaining isolated settings without overwriting.
  for (let i = 0; i < 200; i++) {
    if (await d.page.evaluate('!document.body.innerText.includes("more_vert")', d.root())) break;
    await sleep(20);
  }
  await installPackage(d.page, d.root());
  await d.wait(s => s.handlers.length === 3);
  // Reinstallation can create a new class instance of the cached module.
  await d.bindMain();
  await d.bind(d.root());
  const installed = await d.rpc(d.root(), 'find-open', 'reinstalled');
  assert.equal((await d.rpc(d.root(), 'find-request', installed, request(1))).kind, 'matches');
  await d.rpc(d.root(), 'find-control', installed, 'close');
  evidence.steps.push({ name: 'single-submit reinstall and production recovery', after: await d.status() });
  evidence.pass = true;
} catch (error) { evidence.error = error.stack; process.exitCode = 1; }
finally { await d.main.send('NodeWorker.disable').catch(() => {}); report('extension-lifecycle', evidence); console.log(JSON.stringify({ pass: evidence.pass, error: evidence.error, steps: evidence.steps.length })); clearTimeout(timer); d.close(); }
