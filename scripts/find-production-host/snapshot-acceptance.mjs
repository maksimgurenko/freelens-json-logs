// Actual installed renderer/SDK + owned Kubernetes logs. DOM events/Range only.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { driver, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { evidence } from './config.mjs';

const d = await driver(), result = { session: privateSession(), checks: [],
  scope: 'Real Kubernetes snapshots/restarts and installed DOM/SDK. No physical/native input or clipboard.' };
const fixture = JSON.parse(readFileSync(`${evidence}/sequence-fixture.json`));
const profileName = `Find48 alternate ${fixture.podUid}`;
const kubectl = args => execFileSync('kubectl', ['--context', 'kind-freelens-json-logs-spike', '-n', fixture.namespace, ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const check = (ok, label) => { assert(ok, label); result.checks.push(label); };
const evaluate = code => d.page.evaluate(code, d.cluster());
// Server counters include all clients: equality proves no log fetch, but growth
// alone cannot attribute a request. Record this limit instead of fabricating a
// writable SDK seam or treating Node HTTP as Chromium Network traffic.
const logRequests = () => {
  const metrics = kubectl(['get', '--raw', '/metrics']);
  return metrics.split('\n').filter(line => line.startsWith('apiserver_request_total{') &&
    line.includes('resource="pods"') && line.includes('subresource="log"'))
    .reduce((sum, line) => sum + Number(line.split(' ').at(-1)), 0);
};
const until = async (code, label) => {
  for (let i = 0; i < 500; i++) { if (await evaluate(code)) return; await sleep(20); }
  throw Error(label + ': ' + await evaluate('document.querySelector(".readable-logs")?.innerText'));
};
const button = name => evaluate(`__snapshot48.button(${JSON.stringify(name)})`);
const query = async text => {
  await evaluate(`__snapshot48.edit(${JSON.stringify(text)})`);
  await until(`__snapshot48.count().includes('matching records')`, 'Matching not ready');
};
const append = lines => kubectl(['exec', 'find-sequence', '-c', 'app', '--', 'sh', '-c', 'printf "%s\\n" "$@" > /proc/1/fd/1', 'append', ...lines]);
const refresh = async length => {
  const before = logRequests(); await button('Refresh');
  await until(`__snapshot48.rows().length===${length} && document.querySelector('.rl-records').getAttribute('aria-busy')==='false' && (!document.querySelector('#rl-find')?.value || __snapshot48.count().includes('matching records'))`, 'Refresh not settled');
  const after = logRequests();
  result.refreshes ??= []; result.refreshes.push({ before, after, rows: length });
  check(after > before, 'Explicit Refresh receives newly appended real Kubernetes logs');
};
try {
  await d.bind(d.cluster());
  await evaluate("global.LensExtensions.Renderer.Navigation.navigate('/overview');true");
  await d.wait(s => !s.live && !s.service.owners);
  await evaluate('globalThis.__snapshot48={};true');
  const clusterId = await evaluate('LensExtensions.Renderer.Catalog.getActiveCluster().id');
  await evaluate(`__findRenderer.navigate('readable-logs',${JSON.stringify({ namespace: fixture.namespace, pod: fixture.pod, podUid: fixture.podUid, clusterId })});true`);
  await until('document.querySelectorAll(".rl-record").length===5', 'Initial snapshot unavailable');
  await evaluate(`Object.assign(__snapshot48,{
    root:()=>document.querySelector('.readable-logs'),rows:()=>[...document.querySelectorAll('.rl-record')],
    input:()=>document.querySelector('#rl-find'),count:()=>document.querySelector('.rl-find-count')?.textContent,
    active:()=>Number(document.querySelector('.rl-find-current')?.dataset.recordIndex??-1),
    button(name){const b=[...this.root().querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===name||b.textContent.trim()===name);if(!b||b.disabled)throw Error('Missing enabled '+name);b.click()},
    edit(text){const e=this.input();e.setSelectionRange(0,e.value.length);e.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,inputType:'insertFromPaste',data:text}));Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,text);e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste',data:text}))}
  });true`);
  await button('Pause'); await button('Find'); await query('upstream');
  check(await evaluate('__snapshot48.active()===0 && __snapshot48.count()==="1 of 3 matching records"'), 'D03 real row-zero hit is included');
  await button('Clear Find');
  await button('Previous match').then(() => { throw Error('Empty navigation must be disabled'); }, () => {});
  await query('upstream'); await button('Next match');
  check(await evaluate('__snapshot48.active()===1'), 'Repeated application content has a distinct retained occurrence');
  await evaluate(`(()=>{const h=__snapshot48,row=h.rows()[1];row.querySelector('.rl-row').click();h.node=row.querySelector('[data-find-source] [data-source-start]').firstChild;h.row=row;const range=document.createRange();range.selectNodeContents(row.querySelector('.rl-message'));getSelection().removeAllRanges();getSelection().addRange(range);h.selection=getSelection().toString();return true})()`);
  // Row activation rebases Find; explicit navigation includes that chosen row.
  await button('Next match');
  append(['{"message":"repeat upstream"}', '{"message":"new upstream"}']); await refresh(7);
  check(await evaluate('__snapshot48.rows()[1]===__snapshot48.row && __snapshot48.rows()[1].querySelector("[data-find-source] [data-source-start]").firstChild===__snapshot48.node'), 'D13 real append preserves retained row/source node identity');
  check(await evaluate('getSelection().toString()===__snapshot48.selection'), 'D13 real append preserves DOM text selection');
  check(await evaluate('__snapshot48.active()===1 && __snapshot48.count()==="2 of 5 matching records" && document.querySelector(".rl-selected")===__snapshot48.row'), 'D13 real append preserves active/inspection occurrence among repeats');
  await evaluate('getSelection().removeAllRanges();true'); await query('arriving');
  check(await evaluate('__snapshot48.active()===-1'), 'Zero-hit query has no active result');
  append(['{"message":"arriving"}']); await refresh(8);
  check(await evaluate('__snapshot48.active()===-1 && __snapshot48.count()==="0 of 1 matching records"'), 'Trace 9 zero-hit gains actual log match without choosing a replacement');
  await button('Next match'); check(await evaluate('__snapshot48.active()===7'), 'Newly gained match waits for explicit navigation');

  // Save an owned profile via production controls; no injected configuration.
  await button('Clear Find'); await button('Close record inspector'); await query('payment');
  check(await evaluate('__snapshot48.count()==="0 of 0 matching records"'), 'Default extraction does not find escaped alternate-only payment');
  const readsBeforeProfile = logRequests();
  await button('Edit profiles'); await button('Duplicate');
  await evaluate(`(()=>{for(const [name,value] of [['Profile name',${JSON.stringify(profileName)}],['Message paths','/alternate']]){const e=document.querySelector('[aria-label="'+name+'"]');Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}))}return true})()`);
  await button('Save profile'); await button('Back to logs');
  await evaluate(`(()=>{const e=document.querySelector('[aria-label="Profile"]');e.value=[...e.options].find(o=>o.text===${JSON.stringify(profileName)}).value;e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
  await until('__snapshot48.count()==="0 of 1 matching records"', 'Profile maintenance not settled');
  const afterAlternate = logRequests();
  check(afterAlternate === readsBeforeProfile && await evaluate('__snapshot48.active()===-1'), 'Trace 9 real saved profile re-evaluates decoded-only hit without fetch or seek');
  await button('Next match'); check(await evaluate('__snapshot48.active()===0'), 'Alternate extracted-only hit navigates original retained occurrence');
  await evaluate(`(()=>{const e=document.querySelector('[aria-label="Profile"]');e.value='default';e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
  await until('__snapshot48.count()==="0 of 0 matching records"', 'Default profile not settled');
  const afterDefault = logRequests();
  result.profileLogRequests = { before: readsBeforeProfile, afterAlternate, afterDefault, scope: 'Whole-cluster apiserver log counters; equality rules out fetch by any client during this interval.' };
  check(afterDefault === readsBeforeProfile && await evaluate('__snapshot48.active()===-1'), 'Profile removing active decoded hit clears it without fetch or substitute');

  // Both original repeats and all old references leave the actual tailLines window.
  await evaluate('__snapshot48.rows()[1].querySelector(".rl-row").click();true');
  await query('upstream');
  check(await evaluate('__snapshot48.active()===1 && document.querySelector(".rl-selected")===__snapshot48.row && !!document.querySelector(".rl-detail")'), 'Eviction precondition has a live repeated reading/inspection/Find occurrence');
  append(Array.from({ length: 1005 }, (_, i) => JSON.stringify({ message: `new ${i} upstream` })));
  await refresh(1000);
  check(await evaluate('__snapshot48.rows().length===1000 && !__snapshot48.row.isConnected && !document.querySelector(".rl-detail") && __snapshot48.active()===-1 && __snapshot48.count()==="0 of 1000 matching records" && __snapshot48.rows()[0].textContent.includes("new 5 upstream")'), 'Trace 8 actual 1000-record retention expires old DOM, inspector and active result safely');
  await query('upstream');
  check(await evaluate('__snapshot48.active()===0 && __snapshot48.count()==="1 of 1000 matching records"'), 'Expired reading row cannot redirect new search by text or saved index');

  // Two real same-container restarts: metadata polling continues during Pause.
  result.restarts = [];
  for (let iteration = 0; iteration < 2; iteration++) {
    if (iteration === 1) await button('Resume');
    await button('Match case');
    await until(`!document.querySelector('[aria-label="Next match"]').disabled`, 'Mode matching not ready');
    await button('Next match');
    const before = JSON.parse(kubectl(['get', 'pod', 'find-sequence', '-o', 'json'])).status.containerStatuses[0];
    kubectl(['exec', 'find-sequence', '--', 'touch', '/tmp/restart']);
    for (let i = 0; i < 700; i++) {
      const current = JSON.parse(kubectl(['get', 'pod', 'find-sequence', '-o', 'json'])).status.containerStatuses?.[0];
      if (current?.restartCount > before.restartCount && current.state.running) { result.restarts.push({ before: { count: before.restartCount, id: before.containerID }, after: { count: current.restartCount, id: current.containerID } }); break; }
      assert(i < 699, 'Owned restart not observed'); await sleep(100);
    }
    await until('document.querySelector("#rl-find").value==="" && document.querySelector(".rl-notice")?.textContent.includes("restart observed")', 'Find did not reset on real observed restart');
    check(await evaluate(`!document.querySelector('.rl-find-current') && document.querySelector('[aria-label="Match case"]').getAttribute('aria-pressed')==='false' && document.querySelector('[aria-label="Profile"]').value==='default'`), `Trace 12 real restart ${iteration + 1} resets query/Match case/result and preserves manual profile`);
    await button('Search history');
    check(await evaluate('document.querySelectorAll(".rl-history-entry").length===0'), `Restart ${iteration + 1} resets temporary history`);
    await button('Close search history');
    if (iteration === 0) {
      check(await evaluate('__snapshot48.rows().length===0 && document.querySelector(".rl-update-status").textContent==="Paused"'), 'Observed restart while paused clears old snapshot without resuming');
      await button('Refresh');
      await until('__snapshot48.rows().length===5', 'Paused explicit current-instance refresh not ready'); await query('upstream');
    } else {
      await until('__snapshot48.rows().length===5', 'Automatic current-instance snapshot not ready');
      check(await evaluate('document.querySelector(".rl-update-status").textContent==="Automatic updates"'), 'Unpaused restart resumes ordinary current-instance snapshots');
    }
  }
  result.pass = true;
} catch (error) { result.error = error.stack; process.exitCode = 1; }
finally {
  await evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');true").catch(() => {});
  result.closed = await d.wait(s => !s.live && !s.service.owners && !s.service.retiring).catch(() => null);
  await evaluate('delete globalThis.__snapshot48;true').catch(() => {});
  report('snapshot-acceptance', result); console.log(JSON.stringify({ pass: result.pass, error: result.error, checks: result.checks.length })); d.close();
}
