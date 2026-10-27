// Actual installed renderer/SDK and Kubernetes log snapshots. Scroll properties
// produce browser scroll events; this is not physical wheel/keyboard delivery.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { driver, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { evidence } from './config.mjs';

const d = await driver(), result = { session: privateSession(), checks: [],
  scope: 'Installed DOM, actual snapshots and worker exits; diagnostic private compositor. No physical/native input or clipboard.' };
const scenario = process.env.FIND_HOST_SCENARIO || 'both';
assert(['both', 'groups', 'following'].includes(scenario));
result.scenario = scenario;
const evaluate = code => d.page.evaluate(code, d.cluster());
const check = (ok, label) => { assert(ok, label); result.checks.push(label); };
const until = async (code, label) => {
  for (let i = 0; i < 500; i++) { if (await evaluate(code)) return; await sleep(20); }
  throw Error(label + ': ' + await evaluate('document.querySelector(".readable-logs")?.innerText.slice(-800)'));
};
const button = name => evaluate(`__marks48.button(${JSON.stringify(name)})`);
const query = async text => { await evaluate(`__marks48.edit(${JSON.stringify(text)})`); await until('__marks48.count()?.includes("matching records")', 'Matching not settled'); };
try {
  await d.bind(d.cluster());
  const fixture = JSON.parse(readFileSync(`${evidence}/fixture.json`));
  const surface = JSON.parse(readFileSync(`${evidence}/surface-fixture.json`));
  const clusterId = await evaluate('LensExtensions.Renderer.Catalog.getActiveCluster().id');
  const open = async (pod, podUid, length) => {
    await evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');true"); await d.wait(s => !s.live && !s.service.owners);
    await evaluate(`__findRenderer.navigate('readable-logs',${JSON.stringify({ namespace: fixture.namespace, pod, podUid, clusterId })});true`);
    await until(`document.querySelectorAll('.rl-record').length===${length}`, 'Real snapshot unavailable');
    await evaluate(`globalThis.__marks48={root:()=>document.querySelector('.readable-logs'),input:()=>document.querySelector('#rl-find'),count:()=>document.querySelector('.rl-find-count')?.textContent,
      button(name){const b=[...this.root().querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===name||b.textContent.trim()===name);if(!b||b.disabled)throw Error('Missing enabled '+name);b.click()},
      edit(text){const e=this.input();e.setSelectionRange(0,e.value.length);e.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,inputType:'insertFromPaste',data:text}));Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,text);e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste',data:text}))},
      following:()=>document.querySelector('.rl-follow-status').textContent,scroller:()=>document.querySelector('.rl-records')};true`);
  };
  if (scenario !== 'following') {
  await open('find-fixtures', fixture.podUid, 120);
  await evaluate(`(()=>{const e=document.querySelector('[aria-label="Container"]');e.value='dense';e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
  await until('document.querySelectorAll(".rl-record").length===1000', 'Dense bound unavailable');
  await button('Pause'); await button('Find');
  await evaluate(`(()=>{const wrap=[...document.querySelectorAll('.rl-display-panel label')].find(l=>l.textContent.includes('Word wrap')).querySelector('input');if(!wrap.checked)wrap.click();return true})()`);
  await query('a');
  await until('document.querySelector(".rl-highlight-status")?.textContent.includes("incomplete")', 'Dense decoration not settled');
  const stableGroup = 'document.querySelector(".rl-find-mark") && __marks48.count()?.includes("matching records") && document.querySelector(".rl-highlight-status")?.textContent.includes("incomplete")';
  await until(stableGroup, 'Initial live group not settled');
  for (let sample=0; sample<500; sample++) {
  result.grouped = await evaluate(`(()=>{
    const marks=[...document.querySelectorAll('.rl-find-mark')],count=b=>Number(/Find (\\d+) matching records/.exec(b.getAttribute('aria-label'))?.[1]??1);
    if(!marks.length||!__marks48.count()?.includes('matching records'))return null;
    globalThis.__find48GroupTrace=[];
    return{members:count(marks[0]),population:marks.reduce((n,b)=>n+count(b),0),marks:marks.length,visited:[]};
  })()`);
  if (result.grouped) break;
  await sleep(20);
  }
  assert(result.grouped, 'Initial matching group not available');
  assert(result.grouped.members > 1, 'Dense first slot did not group records');
  for (let i=0; i<=result.grouped.members*2; i++) {
    await until(stableGroup, 'Live group not settled before click');
    let before;
    for (let sample=0; sample<500; sample++) {
      before=await evaluate(`(()=>{const b=document.querySelector('.rl-find-mark');if(!b||!__marks48.count()?.includes('matching records'))return null;const members=Number(/Find (\\d+) matching records/.exec(b.getAttribute('aria-label'))?.[1]??1),label=b.getAttribute('aria-label');b.click();return{members,label}})()`);
      if (before) break;
      await sleep(20);
    }
    assert(before, 'Current matching control not available');
    // This fixture's first group contains ordered rows 0..members-1. When
    // resizing removes the previous member, a new group starts at its first.
    const previous=result.grouped.visited.at(-1),expected=previous===undefined||previous>=before.members?0:(previous+1)%before.members;
    let after;
    for (let sample=0; sample<500; sample++) {
      after=await evaluate(`(()=>{if(!__marks48.count()?.includes('matching records'))return null;const x={active:Number(document.querySelector('.rl-find-current')?.dataset.recordIndex??-1),count:__marks48.count(),client:__marks48.scroller().clientHeight};__find48GroupTrace.push(x);return x})()`);
      if (after) break;
      await sleep(20);
    }
    assert(after, 'Clicked result matching did not settle');
    result.grouped.visited.push(after.active);
    assert.equal(after.active,expected,`Grouped mark skipped member ${i}: ${JSON.stringify({before,after,expected})}`);
  }
  await until(stableGroup, 'Final live group not settled');
  let outcome;
  for (let sample=0; sample<500; sample++) {
  outcome=await evaluate(`(()=>{
    const root=__marks48.root(),currentControl=root.querySelector('.rl-find-mark');
    if(!currentControl||!__marks48.count()?.includes('matching records')||!root.querySelector('.rl-highlight-status')?.textContent.includes('incomplete'))return null;
    const value={focus:document.activeElement===__marks48.input(),current:currentControl.getAttribute('aria-current'),border:getComputedStyle(currentControl,'::before').borderTopWidth,selected:!!root.querySelector('.rl-selected'),paused:root.querySelector('.rl-update-status').textContent,
      highlights:[...CSS.highlights].reduce((n,[,h])=>n+h.size,0),feedback:root.querySelector('.rl-highlight-status')?.textContent};
    __marks48.button('Search history');value.committed=[...root.querySelectorAll('.rl-history-text')].some(e=>e.textContent==='a');__marks48.button('Close search history');
    value.oldTop=__marks48.scroller().scrollTop;__marks48.button('Close Find');currentControl.click();value.dismissed=!root.querySelector('.rl-find-mark')&&__marks48.scroller().scrollTop===value.oldTop;__marks48.button('Find');value.reopenTop=__marks48.scroller().scrollTop;return value;
  })()`);
  if (outcome) break;
  await sleep(20);
  }
  assert(outcome, 'Final current group/decoration snapshot not available');
  Object.assign(result.grouped,outcome);
  check(result.grouped.population === 1000 && result.grouped.marks < 1000, 'Every dense exact result belongs to measured seven-pixel groups');
  check(result.grouped.visited.length === result.grouped.members * 2 + 1, 'Repeated live mark controls advance and wrap through their current measured members');
  check(result.grouped.focus && result.grouped.current === 'true' && result.grouped.border === '1px', 'Mark focuses Find and exposes non-color current-group distinction');
  check(!result.grouped.selected && result.grouped.paused === 'Paused' && result.grouped.committed, 'Mark keeps inspection/Pause independent and commits history');
  check(result.grouped.dismissed && result.grouped.reopenTop === result.grouped.oldTop, 'Dismissed stale mark cannot replay on click or reopening Find');
  check(result.grouped.highlights <= 1024 && /incomplete/.test(result.grouped.feedback), 'Dense decoration cap reports incomplete without losing exact members');
  }

  if (scenario !== 'groups') {
  await open(surface.pod, surface.podUid, 180);
  await until('__marks48.following()==="Following output"', 'New viewer not following');
  await button('Find'); await query('ordinary 179'); await button('To bottom');
  const append = (start, length) => execFileSync('kubectl', ['--context', 'kind-freelens-json-logs-spike', '-n', fixture.namespace, 'exec', surface.pod, '--',
    'sh', '-c', 'printf "%s\\n" "$@" > /proc/1/fd/1', 'append', ...Array.from({ length }, (_, i) => JSON.stringify({ message: `ordinary ${start + i}${i === 0 ? ' ordinary 179' : ''}` }))], { encoding: 'utf8' });
  const sample = () => evaluate(`({rows:document.querySelectorAll('.rl-record').length,count:__marks48.count(),active:Number(document.querySelector('.rl-find-current')?.dataset.recordIndex??-1),following:__marks48.following(),top:__marks48.scroller().scrollTop,height:__marks48.scroller().scrollHeight,client:__marks48.scroller().clientHeight,update:document.querySelector('.rl-update-status').textContent})`);
  result.following = [await sample()]; append(180, 40);
  await until('document.querySelectorAll(".rl-record").length===220 && __marks48.count()?.includes("of 2 matching records")', 'Automatic appended snapshot not accepted');
  result.following.push(await sample());
  const followed = result.following.at(-1);
  check(followed.following === 'Following output' && followed.top > result.following[0].top && followed.height - followed.client - followed.top <= 2 && followed.active === 179,
    'Automatic append follows bottom while maintenance retains the old active occurrence');
  await evaluate('__marks48.scroller().scrollTop=150;true');
  await until('__marks48.following()==="Scrolled away"', 'Natural DOM scroll event not observed');
  result.following.push(await sample()); append(220, 40);
  await until('document.querySelectorAll(".rl-record").length===260', 'Scrolled-away append not accepted');
  result.following.push(await sample());
  check(result.following.at(-1).following === 'Scrolled away' && Math.abs(result.following.at(-1).top - result.following.at(-2).top) <= 1 && result.following.at(-1).active === 179,
    'Scrolled-away real append preserves viewport anchor and independent active Find');
  await button('Pause'); await button('To bottom'); result.following.push(await sample());
  check(result.following.at(-1).following === 'Following output' && result.following.at(-1).update === 'Paused', 'To bottom follows without resuming explicit Pause');
  append(260, 40); await sleep(3400);
  check(await evaluate('document.querySelectorAll(".rl-record").length===260 && document.querySelector(".rl-update-status").textContent==="Paused"'), 'Actual appended output remains unfetched while paused');
  await button('Refresh'); await until('document.querySelectorAll(".rl-record").length===300', 'Paused Refresh not accepted');
  result.following.push(await sample());
  check(result.following.at(-1).following === 'Following output' && result.following.at(-1).update === 'Paused' && result.following.at(-1).top > result.following.at(-2).top,
    'Paused explicit Refresh follows new bottom and preserves Pause');
  await evaluate("__marks48.root().style.width='390px';true"); await sleep(100); await button('Close Find');
  check(await evaluate('__marks48.following()==="Following output" && document.querySelector(".rl-update-status").textContent==="Paused"'), 'Resize and Close Find preserve explicit following and Pause');
  await evaluate('__marks48.root().style.width="";true');
  }
  result.pass = true;
} catch (error) { result.error = error.stack; process.exitCode = 1; }
finally {
  result.groupTrace = await evaluate('globalThis.__find48GroupTrace').catch(() => null);
  await evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');delete globalThis.__marks48;true").catch(() => {});
  result.closed = await d.wait(s => !s.live && !s.service.owners && !s.service.retiring).catch(() => null);
  report('marks-following', result); console.log(JSON.stringify({ pass: result.pass, error: result.error, checks: result.checks.length })); d.close();
}
