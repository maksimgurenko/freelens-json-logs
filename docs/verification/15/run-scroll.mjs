// Executable production-host interaction check. Requires setup.js and find.js,
// a fresh fixture with 180 initial rows, and the installed production tarball.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const evidence = { at: new Date().toISOString(), stages: [] };
const probe = '.scratch/readable-logs/15/scroll-stage.js';
function evaluate(expression) {
  writeFileSync(probe, `(async()=>{const p=global.__rl15;${expression}})()`);
  const response = JSON.parse(execFileSync(process.execPath, ['scripts/host-cdp.mjs', '770814', probe], { encoding: 'utf8' }));
  if (response.exceptionDetails) throw Error(JSON.stringify(response));
  return response.result.value;
}
let total = 180;
function emit(count) {
  total += count;
  execFileSync('kubectl', ['--context', 'kind-freelens-json-logs-spike', 'exec', '-n', 'readable-logs-ticket-15', 'navigation', '--', 'sh', '-c', `echo ${count} > /tmp/emit`]);
  for (let attempt = 0; attempt < 30; attempt++) {
    const line = execFileSync('kubectl', ['--context', 'kind-freelens-json-logs-spike', 'logs', '-n', 'readable-logs-ticket-15', 'navigation', '--tail=1'], { encoding: 'utf8' });
    if (line.includes(`row ${String(total).padStart(4, '0')}`)) return { count, total, lastRealLine: line.trim() };
  }
  throw Error('Fixture emission did not complete');
}
const refresh = expected => `const requestsBefore=p.requests.length;await p.click('Refresh');for(let i=0;i<100&&(p.rows().length!==${expected}||p.button('Refresh').disabled);i++)await p.tick();p.assert(p.rows().length===${expected},'Wrong accepted row count');p.assert(p.button('Resume'),'Refresh changed Pause');p.assert(p.requests.length===requestsBefore+1,'Paused Refresh must make exactly one extension read');`;
try {
  evaluate(`await p.click('To bottom');return p.geometry();`);
  const emission = emit(40);
  evidence.stages.push(evaluate(`${refresh(220)}p.assert(p.geometry().bottom<=2,'Bottom not followed');return {name:'bottom follow on paused Refresh',emission:${JSON.stringify(emission)},geometry:p.geometry(),paused:true};`));
  const duplicateBefore = evaluate(`const anchor=await p.scrollTo(29,-7.25);p.assert(anchor.index===29,'Wrong repeated anchor');return anchor;`);
  emit(20);
  evidence.stages.push(evaluate(`${refresh(240)}const anchor=p.anchor();p.assert(anchor.text===${JSON.stringify(duplicateBefore.text)},'Repeated anchor changed');p.assert(anchor.index===29,'Repeated occurrence shifted');p.assert(Math.abs(anchor.offset-(${duplicateBefore.offset}))<1,'Repeated offset shifted');return {name:'repeated application records preserve visible occurrence',before:${JSON.stringify(duplicateBefore)},after:anchor,geometry:p.geometry()};`));
  const before = evaluate(`await p.query('Private.Needle[0]');const count=p.root().querySelector('.rl-find-count').textContent;await p.query('');const anchor=await p.scrollTo(150,-6.25);return {anchor,count};`);
  emit(800);
  evidence.stages.push(evaluate(`${refresh(1000)}const anchor=p.anchor();p.assert(anchor.index===110,'Surviving anchor did not shift by dropped prefix');p.assert(anchor.text===${JSON.stringify(before.anchor.text)},'Surviving anchor text changed');p.assert(Math.abs(anchor.offset-(${before.anchor.offset}))<1,'Surviving anchor offset changed');p.assert(!p.root().innerText.includes('Your scroll position left'),'False anchor loss');const count=(await p.query('Private.Needle[0]')).counter;p.assert(count==='1 of 1000 matching records','Find did not recompute with accepted window');await p.query('');return {name:'bounded suffix preserves anchor and recomputes Find',before:${JSON.stringify(before)},after:anchor,newCount:count,rows:p.rows().length};`));
  evaluate(`await p.scrollTo(0,-4);return p.anchor();`);
  emit(1100);
  evidence.stages.push(evaluate(`${refresh(1000)}p.assert(p.root().innerText.includes('Your scroll position left the recent log window'),'Missing anchor-loss notice');p.assert(p.geometry().following==='Scrolled away','Lost anchor silently followed');const lost={notice:true,geometry:p.geometry()};await p.click('To bottom');p.assert(!p.root().innerText.includes('Your scroll position left'),'To bottom did not acknowledge loss');p.assert(p.geometry().bottom<=2,'To bottom failed');return {name:'lost anchor and To bottom',lost,restored:p.geometry()};`));
  evaluate(`await p.click('Resume');for(let i=0;i<100&&p.button('Refresh').disabled;i++)await p.tick();return {requests:p.requests.length};`);
  emit(5);
  evidence.stages.push(evaluate(`for(let i=0;i<110&&!p.rows().at(-1).textContent.includes('row 2145');i++)await p.tick();p.assert(p.rows().at(-1).textContent.includes('row 2145'),'Automatic window not accepted');p.assert(p.geometry().bottom<=2,'Automatic output not followed');await p.click('Pause');return {name:'automatic following',geometry:p.geometry(),last:p.rows().at(-1).querySelector('.rl-message').textContent,requests:p.requests};`));
  writeFileSync('docs/verification/15/scroll.json', JSON.stringify(evidence, null, 2)+'\n');
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  writeFileSync('docs/verification/15/scroll-failed.json', JSON.stringify({ ...evidence, error: String(error) }, null, 2)+'\n');
  throw error;
}
