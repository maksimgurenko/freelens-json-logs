import assert from 'node:assert/strict';
import { driver, report, sleep } from './driver.mjs';
const d = await driver(), evidence = {};
try {
  await d.bind(d.cluster());
  const clusterId = await d.page.evaluate('global.LensExtensions.Renderer.Catalog.getActiveCluster().id', d.cluster());
  const result = await d.page.evaluate(`(async()=>{
    [...document.querySelectorAll('button')].find(x=>x.innerText==='Find').click();
    const input=document.querySelector('#rl-find');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'freelens-json-logs-spike');
    input.dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('[aria-label="Match case"]').click();
    document.querySelector('[aria-label="Whole words"]').click();
    await new Promise(r=>setTimeout(r,200));
    return {query:input.value,status:document.querySelector('#rl-findbar').innerText,flags:['Match case','Whole words'].map(n=>document.querySelector('[aria-label="'+n+'"]').getAttribute('aria-pressed')),body:document.body.innerText.slice(-900)};
  })()`, d.cluster());
  assert.equal(result.query, 'freelens-json-logs-spike'); assert.deepEqual(result.flags, ['true', 'true']);
  assert.match(result.status, /1 of 1/);
  evidence.active = { ...result, main: await d.status() };
  await d.page.evaluate(`global.LensExtensions.Renderer.Navigation.navigate('/extensions');true`, d.root());
  evidence.inactive = await d.wait(s => s.live === 0 && s.service.executions.every(e => !e.active));
  await d.page.evaluate(`global.LensExtensions.Renderer.Navigation.navigate('/cluster/'+${JSON.stringify(clusterId)});true`, d.root());
  await sleep(500);
  evidence.returned = await d.page.evaluate(`({query:document.querySelector('#rl-find').value,flags:['Match case','Whole words'].map(n=>document.querySelector('[aria-label="'+n+'"]').getAttribute('aria-pressed')),status:document.querySelector('#rl-findbar').innerText,body:document.body.innerText.slice(-700)})`, d.cluster());
  assert.equal(evidence.returned.query, result.query); assert.deepEqual(evidence.returned.flags, result.flags);
  assert.match(evidence.returned.body, /Automatic updates/);
  await d.page.evaluate(`global.LensExtensions.Renderer.Navigation.navigate('/overview');true`, d.cluster());
  evidence.closed = await d.wait(s => !s.live && !s.service.owners && !s.service.retiring);
  evidence.pass = true;
} catch (error) { evidence.error = error.stack; process.exitCode = 1; }
finally { report('mounted-host-viewer', evidence); console.log(JSON.stringify({ pass: evidence.pass, error: evidence.error })); d.close(); }
