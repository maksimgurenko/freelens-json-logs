import assert from 'node:assert/strict';
import { driver, request, report } from './driver.mjs';
import { privateSession } from './private-session.mjs';
const evidence = { session: privateSession() }, d = await driver();
try {
  await d.bind(d.root());
  const token = await d.rpc(d.root(), 'find-open', 'shutdown-startup');
  await d.main.send('NodeWorker.enable', { waitForDebuggerOnStart: true });
  await d.page.evaluate(`global.__shutdownJob=global.__findSdk.invoke('find-request',${JSON.stringify(token)},${JSON.stringify(request(1))});global.__shutdownJob.catch(()=>{});true`, d.root());
  evidence.before = await d.wait(s => s.live === 1 && s.service.executions.some(e => e.running && !e.ready));
  assert.equal(evidence.before.beforeQuit, 1);
  evidence.scheduled = await d.main.evaluate(`(()=>{
    const E=process.mainModule.require('electron'), fs=process.mainModule.require('node:fs');
    const service=global.__findMain.find;
    E.app.once('will-quit',()=>fs.writeFileSync('/home/max/work/freelens-json-logs/docs/verification/42/host/shutdown-clean.json',JSON.stringify({pid:process.pid,workers:global.__findObserve.snapshot(),service:{closed:service.closed,owners:service.owners.size,retiring:service.retiring.size,opening:service.opening.size,senders:service.senders.size,watch:!!service.stopWatch}},null,2)));
    setTimeout(()=>E.app.quit(),30);return true;
  })()`);
} catch (error) { evidence.error = error.stack; process.exitCode = 1; }
finally { report('shutdown-startup', evidence); console.log(JSON.stringify({ scheduled: evidence.scheduled, error: evidence.error })); d.close(); }
