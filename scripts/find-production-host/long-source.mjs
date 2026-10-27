// Sparse terminal hit in the real packed viewer. DOM/Range evidence only.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { driver, report, sleep } from './driver.mjs';
import { checkFrameCadence } from './frame-cadence.mjs';
import { evidence } from './config.mjs';

const d = await driver(), result = { checks: [] };
const until = async predicate => {
  for (let i = 0; i < 400; i++) { if (await predicate()) return; await sleep(25); }
  throw Error('Sparse terminal hit did not settle');
};
try {
  result.cadence = await checkFrameCadence(d);
  await d.bind(d.cluster());
  const fixture = JSON.parse(readFileSync(`${evidence}/fixture.json`, 'utf8'));
  const clusterId = await d.page.evaluate('global.LensExtensions.Renderer.Catalog.getActiveCluster().id', d.cluster());
  await d.page.evaluate("global.LensExtensions.Renderer.Navigation.navigate('/overview');true", d.cluster());
  await d.wait(s => !s.live && !s.service.owners);
  await d.page.evaluate(`global.__findRenderer.navigate('readable-logs',${JSON.stringify({ namespace: fixture.namespace, pod: 'find-fixtures', podUid: fixture.podUid, clusterId })});true`, d.cluster());
  await until(() => d.page.evaluate('document.querySelectorAll(".rl-record").length===120', d.cluster()));
  await d.page.evaluate(`(()=>{const s=document.querySelector('select[aria-label="Container"]');s.value='long';s.dispatchEvent(new Event('change',{bubbles:true}));return true})()`, d.cluster());
  await until(() => d.page.evaluate('document.querySelectorAll(".rl-record").length===1&&!document.querySelector(".rl-records[aria-busy=true]")', d.cluster()));
  result.observations = await d.page.evaluate(`(async()=>{
    const root=document.querySelector('.readable-logs'),scroller=root.querySelector('.rl-records');
    const b=name=>[...root.querySelectorAll('button')].find(e=>e.textContent.trim()===name||e.getAttribute('aria-label')===name).click();
    const frames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    b('Pause');b('Find');const input=root.querySelector('#rl-find');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Q');input.dispatchEvent(new Event('input',{bubbles:true}));
    for(let i=0;i<400;i++){if(root.querySelector('.rl-find-count').textContent==='1 of 1 matching records')break;await new Promise(r=>setTimeout(r,25))}
    root.querySelector('.rl-display-options').open=true;
    [...root.querySelectorAll('.rl-display-panel label')].find(e=>e.textContent.includes('Word wrap')).querySelector('input').click();
    root.querySelector('.rl-display-options').open=false;await frames();b('To bottom');
    const samples=[];
    for(let i=0;i<20;i++){
      await new Promise(r=>setTimeout(r,100));
      const source=root.querySelector('.rl-message'),fragment=source.querySelector('[data-source-start]:last-child'),range=document.createRange();
      range.setStart(fragment.firstChild,fragment.textContent.length-1);range.setEnd(fragment.firstChild,fragment.textContent.length);
      const rect=range.getBoundingClientRect(),clip=scroller.getBoundingClientRect();
      samples.push({count:root.querySelector('.rl-find-count').textContent,following:root.querySelector('.rl-follow-status').textContent,
        text:range.toString(),rect:rect.toJSON(),clip:clip.toJSON(),visible:rect.bottom>clip.top&&rect.top<clip.bottom&&rect.right>clip.left&&rect.left<clip.right,
        highlights:[...CSS.highlights].flatMap(([,h])=>[...h].map(r=>r.toString())),status:root.querySelector('.rl-highlight-status')?.textContent,
        scrollTop:scroller.scrollTop,scrollHeight:scroller.scrollHeight,clientHeight:scroller.clientHeight});
    }
    return samples;
  })()`, d.cluster());
  assert(result.observations.some(s => s.count === '1 of 1 matching records') &&
    result.observations.every(s => ['1 of 1 matching records', 'Matching pending', 'Searching…'].includes(s.count)));
  result.checks.push('Completed exact matching remains one record; maintenance is honestly pending');
  assert(result.observations.some(s => s.visible && s.text === 'Q'), 'Terminal Q was never visible');
  result.checks.push('Terminal Q is visible in the real source');
  const decorated = s => s.visible && s.highlights.includes('Q') && !s.status;
  assert(result.observations.some((s, i, samples) => i >= 2 && samples.slice(i - 2, i + 1).every(decorated)),
    'Visible terminal Q has no settled Custom Highlight');
  result.checks.push('Visible terminal Q has a settled source-safe Custom Highlight');
  result.pass = true;
} catch (error) { result.error = error.stack; result.pass = false; process.exitCode = 1; }
finally {
  report('long-source', result); console.log(JSON.stringify({ pass: result.pass, checks: result.checks, error: result.error }));
  await d.page.evaluate("global.LensExtensions.Renderer.Navigation.navigate('/overview');true", d.cluster()).catch(() => {});
  await d.wait(s => !s.live && !s.service.owners).catch(() => {}); d.close();
}
