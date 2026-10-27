// #48 installed production renderer, real Kubernetes snapshots and real SDK.
// DOM events/Range observations establish browser integration, not physical input.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { driver, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
const result = { session: privateSession(), checks: [], inputLayer: 'DOM events only; native/physical/clipboard unverified' };
const d = await driver();
let pumping=false,frames=0;
const pump=setInterval(async()=>{if(pumping)return;pumping=true;try{await d.page.send('Page.captureScreenshot',{format:'png'});frames++;}catch{}finally{pumping=false;}},100);
result.renderingSchedule='Background CDP screenshots drive frames: private compositor has zero-size output. This does not verify native presentation cadence.';
try {
  await d.bind(d.cluster());
  const fixture = JSON.parse(readFileSync('docs/verification/48/host/fixture.json'));
  const clusterId = await d.page.evaluate('global.LensExtensions.Renderer.Catalog.getActiveCluster().id', d.cluster());
  await d.page.evaluate(`global.LensExtensions.Renderer.Navigation.navigate('/overview');true`,d.cluster());
  await d.wait(s=>!s.live&&!s.service.owners);
  await d.page.evaluate(`global.__findRenderer.navigate('readable-logs',${JSON.stringify({ namespace: fixture.namespace, pod:'find-fixtures', podUid:fixture.podUid, clusterId })});true`, d.cluster());
  for (let i=0;i<300;i++) { if(await d.page.evaluate('document.querySelectorAll(".rl-record").length===120',d.cluster()))break; await sleep(30); }
  result.rendering = await d.page.evaluate(`(async()=>{
    const root=document.querySelector('.readable-logs'), rows=()=>[...root.querySelectorAll('.rl-record')];
    const checks=globalThis.__find48Checks=[],check=(ok,message)=>{if(!ok)throw Error(message);checks.push(message)};
    const wait=async(predicate)=>{for(let i=0;i<300;i++){if(predicate())return;await new Promise(r=>setTimeout(r,20));}throw Error('DOM condition did not settle: '+root.querySelector('.rl-findbar')?.innerText)};
    const button=name=>{const b=[...root.querySelectorAll('button')].find(x=>x.textContent.trim()===name||x.getAttribute('aria-label')===name);if(!b)throw Error('Missing '+name);b.click();};
    const active=()=>Number(root.querySelector('.rl-find-current')?.dataset.recordIndex??-1), input=()=>root.querySelector('#rl-find');
    const query=async(value,replacement=false)=>{if(replacement){input().setSelectionRange(0,input().value.length);input().dispatchEvent(new InputEvent('beforeinput',{bubbles:true,inputType:'insertFromPaste',data:value}));}else input().setSelectionRange(input().value.length,input().value.length);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input(),value);input().dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:value}));await wait(()=>/matching records/.test(root.querySelector('.rl-find-count').textContent));await new Promise(r=>setTimeout(r,80));};
    check(rows().length===120,'actual 120-record Kubernetes snapshot');button('Pause');button('Find');
    rows()[64].querySelector('.rl-row').click();await query('up');check(active()===73,'D01 inclusive reading row resolves 73 from 64');
    for(const q of ['ups','upst','upstr','upstre','upstrea','upstream']){await query(q);check(active()===73,'D04 refinement '+q+' retains 73');}
    button('Next match');check(active()===82,'D05 Next reaches 82');await query('upstreamx');check(active()===-1,'D05 no-hit clears displayed result');await query('upstream');check(active()===82,'D05 correction restores candidate 82');
    await query('upstream',true);check(active()===73,'D06 identical full pre-insertion replacement resets origin');
    rows()[64].querySelector('.rl-row').click();button('Clear');root.querySelector('.rl-records').scrollTop=1500;await query('upstream');check(active()===2,'D02/D03 no anchor starts at retained beginning despite scroll');
    button('Previous match');check(active()===90&&root.textContent.includes('Wrapped to end'),'D09 Previous wraps globally');button('Next match');check(active()===2&&root.textContent.includes('Wrapped to beginning'),'D09 Next wraps globally');
    const node=rows()[2].querySelector('[data-find-source] [data-source-start]').firstChild;
    await wait(()=>[...CSS.highlights].some(([,h])=>[...h].some(r=>r.toString()==='upstream')));
    check([...CSS.highlights].flatMap(([,h])=>[...h]).every(r=>r.toString()==='upstream'),'D07 actual Freelens Custom Highlights use exact source spans');
    rows()[2].querySelector('.rl-row').focus({preventScroll:true});const range=document.createRange();range.selectNodeContents(rows()[2].querySelector('.rl-message'));getSelection().removeAllRanges();getSelection().addRange(range);const selection=getSelection().toString();
    await query('upst');check(rows()[2].querySelector('[data-find-source] [data-source-start]').firstChild===node,'D07/D13 query decoration preserves real source node');check(getSelection().toString()===selection,'D07/D13 query decoration preserves DOM selection');getSelection().removeAllRanges();
    button('Clear');await query('needle');check(active()===10,'D08 hidden original source counted');const hint=root.querySelector('.rl-match-hint');check(hint?.dataset.label==='Match in original text','D08 hidden source has truthful inline label');hint.click();check(root.querySelector('.rl-detail pre').textContent.includes('"secret": "needle"'),'D08 action opens exact Application text');button('Close record inspector');
    button('Clear');await query('payment');check(active()===11,'D08 decoded-only active message counted');root.querySelector('.rl-display-options').open=true;button('Raw');root.querySelector('.rl-display-options').open=false;check(root.querySelector('.rl-match-hint')?.dataset.label==='Match in extracted message','D08 Raw exposes decoded-only hint');root.querySelector('.rl-match-hint').click();check(root.querySelector('.rl-detail pre').textContent==='decoded Σ payment','D08 extracted representation is exact decoded source');button('Close record inspector');
    root.querySelector('.rl-display-options').open=true;button('Readable');root.querySelector('.rl-display-options').open=false;
    button('Clear');button('Close Find');const source=rows()[2].querySelector('.rl-message'),seed=document.createRange();seed.selectNodeContents(source);getSelection().removeAllRanges();getSelection().addRange(seed);button('Find');await wait(()=>input().value===source.textContent);check(input().value==='row 2 upstream','D12 eligible actual source Range seeds empty Find');getSelection().removeAllRanges();
    await wait(()=>/matching records/.test(root.querySelector('.rl-find-count').textContent));button('Next match');button('Close Find');button('Find');button('Search history');check([...root.querySelectorAll('.rl-history-entry')].some(e=>e.querySelector('.rl-history-text')?.textContent==='row 2 upstream'),'D16 committed history visible');button('Close search history');

    check(getComputedStyle(root.querySelector('.rl-records')).backgroundColor==='rgb(0, 0, 0)'&&!root.querySelector('.rl-line-number'),'black canvas and absence of line counters');check(root.querySelector('.rl-findbar').parentElement===root,'Find bar separate from compact toolbar');
    const highlights=[...CSS.highlights].map(([name,h])=>({name,size:h.size}));
    return {checks,highlights,query:input().value,paused:root.querySelector('.rl-update-status').textContent,documentHasFocus:document.hasFocus(),historyLength:history.length};
  })()`,d.cluster());
  result.pass = true;
} catch(error) { result.error=error.stack;process.exitCode=1; }
finally {clearInterval(pump);result.capturedFrames=frames;result.completedChecks=await d.page.evaluate('globalThis.__find48Checks',d.cluster()).catch(()=>[]);report('integrated-acceptance',result);console.log(JSON.stringify({pass:result.pass,error:result.error,checks:result.rendering?.checks.length}));d.close();}
