// DOM composition boundary only; real IME delivery remains an attended gate.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { driver, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { evidence } from './config.mjs';

const d = await driver(), result = { session: privateSession(), pass: false,
  scope: 'Actual installed viewer/SDK/worker with synthetic DOM composition. No native IME, keyboard, clipboard or focus simulation.' };
const evaluate = code => d.page.evaluate(code, d.cluster());
try {
  await d.bind(d.cluster());
  const fixture = JSON.parse(readFileSync(`${evidence}/fixture.json`));
  const clusterId = await evaluate('LensExtensions.Renderer.Catalog.getActiveCluster().id');
  await evaluate(`__findRenderer.navigate('readable-logs',${JSON.stringify({ namespace: fixture.namespace, pod: 'find-fixtures', podUid: fixture.podUid, clusterId })});true`);
  for (let i = 0; ; i++) {
    if (await evaluate('document.querySelectorAll(".rl-record").length>=120 && !document.querySelector(".rl-records[aria-busy=true]")')) break;
    assert(i < 400, 'Snapshot did not settle'); await sleep(10);
  }
  result.observed = await evaluate(`(()=>{const root=document.querySelector('.readable-logs'),button=n=>{const b=[...root.querySelectorAll('button')].find(b=>b.textContent.trim()===n||b.getAttribute('aria-label')===n);if(!b||b.disabled)throw Error('Missing enabled '+n);b.click()};button('Pause');button('Find');const e=root.querySelector('#rl-find');
    e.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'stale');e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertCompositionText',data:'stale',isComposing:true}));
    if(!root.querySelector('[aria-label="Next match"]').disabled)throw Error('Composition navigation must be disabled');
    button('Clear Find');e.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'stale'}));
    return {query:e.value,count:root.querySelector('.rl-find-count').textContent,active:!!root.querySelector('.rl-find-current'),paused:root.querySelector('.rl-update-status').textContent}})()`);
  assert.deepEqual(result.observed, { query: '', count: 'Enter text to find', active: false, paused: 'Paused' });
  await sleep(150);
  result.settled = await evaluate(`({query:document.querySelector('#rl-find').value,count:document.querySelector('.rl-find-count').textContent,highlights:CSS.highlights.size})`);
  assert.deepEqual(result.settled, { query: '', count: 'Enter text to find', highlights: 0 });
  result.pass = true;
} catch (error) { result.error = error.stack; }
finally {
  try {
    await evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');true");
    result.closed = await d.wait(s => !s.live && !s.service.owners && !s.service.retiring && !s.service.opening && !s.service.senders && !s.service.watch);
  } catch (error) { result.closeError = error.stack; result.pass = false; }
  if (!result.pass) process.exitCode = 1;
  report('composition-clear', result); console.log(JSON.stringify({ pass: result.pass, error: result.error, closeError: result.closeError })); d.close();
}
