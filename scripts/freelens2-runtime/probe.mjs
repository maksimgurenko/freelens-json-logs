import { connect } from './cdp.mjs';
import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const action = process.argv[2] || 'status';
const directory = '/tmp/freelens2-runtime-57/docs/research/freelens2-runtime';
const scratch = '/tmp/freelens2-runtime-57/.scratch/find/57-host';
const sleep = ms => new Promise(r => setTimeout(r, ms));
let main, page;
const results = { action, started: new Date().toISOString(), observations: [] };
const timer = setTimeout(() => { console.error('Probe deadline'); main?.close(); page?.close(); process.exit(2); }, 55_000);
try {
  const pid = Number(readFileSync(scratch + '/host-pid', 'utf8'));
  assert.equal(realpathSync('/proc/' + pid + '/exe'), '/home/max/work/freelens2/freelens/dist/linux-unpacked/freelens');
  main = await connect(9252); page = await connect(9251);
  const root = () => [...page.contexts.values()].find(c => c.auxData?.isDefault && /^https:\/\/renderer\./.test(c.origin));
  const cluster = () => [...page.contexts.values()].find(c => c.auxData?.isDefault && /^https:\/\/[^.]+\.renderer\./.test(c.origin));
  const evaluate = (text, context = cluster() ?? root()) => page.evaluate(text, context);
  const wait = async (get, predicate) => {
    for (let i = 0; i < 500; i++) { const value = await get(); if (predicate(value)) return value; await sleep(50); }
    throw Error('Readiness/state deadline');
  };
  const state = () => main.evaluate('globalThis.__probe57?.state()');
  const rpc = (method, ...args) => evaluate(`globalThis.__probe57.rpc.invoke(${JSON.stringify(method)},...${JSON.stringify(args)})`);
  if (action === 'status') {
    results.observations.push({ contexts: [...page.contexts.values()],
      root: await evaluate('({url:location.href,text:document.body.innerText.slice(-12000),api:!!globalThis.FreelensExtensionApi})', root()),
      state: await state() });
  } else if (action === 'install') {
    await evaluate("FreelensExtensionApi.Renderer.Navigation.navigate('/extensions');true", root());
    await wait(() => evaluate('document.body.innerText', root()), text => text.includes('Install'));
    await evaluate(`(()=>{const input=document.querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'/tmp/freelens2-runtime-57/.scratch/fixture57.tgz');input.dispatchEvent(new Event('input',{bubbles:true}));return true})()`, root());
    await sleep(150);
    await evaluate("[...document.querySelectorAll('button')].find(e=>e.innerText==='Install').click();true", root());
    await sleep(300);
    await evaluate("[...document.querySelectorAll('button')].find(e=>e.innerText==='Replace')?.click();true", root());
    const loaded = await wait(async () => ({ state: await state(), version: await main.evaluate('globalThis.__probe57?.version') }), value => value.version === '0.0.58');
    await wait(() => evaluate('!!globalThis.__probe57?.ready', root()), Boolean);
    results.observations.push({ loaded, renderer: await evaluate('globalThis.__probe57.identity', root()) });
  } else if (action === 'open') {
    const clusterId = await evaluate("(()=>{const R=FreelensExtensionApi.Renderer;const c=R.Catalog.getAllClusters()[0];if(!c)throw Error('Fixture cluster missing');R.Navigation.navigate('/cluster/'+c.id);return c.id})()", root());
    await wait(async () => !!cluster(), Boolean);
    await wait(() => evaluate('!!globalThis.__probe57?.ready'), Boolean);
    const pod = JSON.parse(execFileSync('kubectl', ['--context', 'kind-freelens-json-logs-spike', '-n', 'readable-logs-spike', 'get', 'pod', 'single-json', '-o', 'json'], { encoding: 'utf8' }));
    const params = { namespace: pod.metadata.namespace, pod: pod.metadata.name, podUid: pod.metadata.uid, clusterId };
    // Actual SDK API lookup and native Pod details toolbar, without cluster mutations.
    results.observations.push(await evaluate(`(async()=>{const R=FreelensExtensionApi.Renderer;const p=await R.K8sApi.podsApi.get({namespace:${JSON.stringify(params.namespace)},name:${JSON.stringify(params.pod)}});if(!p)throw Error('Pod missing');R.Navigation.showDetails(p.selfLink);return {uid:p.metadata.uid,name:p.getName(),selfLink:p.selfLink}})()`));
    await wait(() => evaluate("!!document.querySelector('[data-probe57=toolbar]')"), Boolean);
    const menu = await evaluate("[...document.querySelectorAll('*')].filter(e=>e.childElementCount===0&&e.textContent==='Runtime probe 57').map(e=>({html:e.parentElement.outerHTML.slice(0,2500)}))");
    results.observations.push({ toolbar: menu });
    await evaluate("[...document.querySelectorAll('span.title')].find(e=>e.textContent==='Runtime probe 57').click();true");
    await wait(() => evaluate("document.querySelector('#probe57-params')?.textContent"), Boolean);
    const actual = await evaluate("JSON.parse(document.querySelector('#probe57-params').textContent)");
    assert.deepEqual(actual, params);
    results.observations.push({ params: actual, identity: await evaluate('__probe57.identity'), rpcIdentity: await rpc('identity') });
    writeFileSync(directory + '/target.json', JSON.stringify(params, null, 2) + '\n');
  } else if (action === 'settings') {
    await evaluate("__probe57.edit('bottom','Runtime saved profile');true");
    const saved = await wait(state, value => value.configuration.viewer.inspection === 'bottom' && value.configuration.profiles[0]?.name === 'Runtime saved profile');
    const rendered = await wait(() => evaluate("document.querySelector('#probe57-settings')?.textContent"), value => value?.includes('Runtime saved profile'));
    const disk = await wait(async () => JSON.parse(readFileSync(saved.settingsPath, 'utf8')), value => value.viewer?.inspection === 'bottom');
    results.observations.push({ saved, rendered: JSON.parse(rendered), disk, reactions: await evaluate('__probe57.reactions') });
    assert((await evaluate('__probe57.reactions')).some(r => r.layout === 'bottom'));
  } else if (action === 'runtime') {
    const id = await rpc('identity');
    const token = await rpc('open', 'explicit-57');
    const request = n => ({ requestId: n, key: { viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1, windowRevision: 1, messageRevision: 1, queryRevision: n }, query: { text: 'σ', matchCase: false, wholeWords: true }, records: [{ ref: { context: 'probe57', occurrence: 0 }, application: 'Σ', message: 'Σ' }], work: 'match' });
    const reply = await rpc('submit', token, request(1));
    assert.equal(reply.kind, 'matches'); assert.equal(reply.records.length, 1);
    const foreign = await evaluate(`__probe57.rpc.invoke('control',${JSON.stringify(token)},'close').then(()=>({accepted:true}),error=>({error:String(error)}))`, root());
    assert.match(foreign.error, /Foreign or disposed/);
    // Submit and cancellation share the real RPC transport; the first queued work
    // is canceled before its worker becomes ready rather than using a fake worker.
    const cancellation = await evaluate(`(async()=>{const p=__probe57;const t=await p.rpc.invoke('open','cancel-57');const q=${JSON.stringify(request(1))};q.records=Array.from({length:1000},(_,i)=>({ref:{context:'cancel57',occurrence:i},application:'Σ'.repeat(2400),message:''}));const pending=p.rpc.invoke('submit',t,q);await p.rpc.invoke('control',t,'cancel');const reply=await pending;await p.rpc.invoke('control',t,'close');return {reply:reply??null,state:await p.rpc.invoke('state')}})()`);
    assert.equal(cancellation.reply, null);
    await rpc('control', token, 'close');
    const target = JSON.parse(readFileSync(directory + '/target.json', 'utf8'));
    const active = await rpc('visibility', target.clusterId);
    await evaluate("FreelensExtensionApi.Renderer.Navigation.navigate('/catalog');true", root());
    await sleep(150);
    const hidden = await rpc('visibility', target.clusterId);
    assert.equal(active.selected, target.clusterId); assert.equal(hidden.selected, null);
    assert.equal(await evaluate('document.hasFocus()'), false);
    results.observations.push({ id, reply, foreign, cancellation, active, hidden, state: await state() });
    await evaluate(`FreelensExtensionApi.Renderer.Navigation.navigate('/cluster/'+${JSON.stringify(target.clusterId)});true`, root());
  } else if (action === 'navigate-away') {
    await evaluate(`(async()=>{const p=__probe57;return p.rpc.invoke('submit',await p.pageToken,{requestId:1,key:{viewerEpoch:1,targetEpoch:1,instanceEpoch:1,windowRevision:1,messageRevision:1,queryRevision:1},query:{text:'hello',matchCase:true,wholeWords:false},records:[{ref:{context:'page57',occurrence:0},application:'hello',message:'hello'}],work:'match'})})()`);
    results.observations.push({ before: await state() });
    await evaluate("FreelensExtensionApi.Renderer.Navigation.navigate('/pods');true");
    const cleaned = await wait(state, value => value.service.owners === 0 && value.workers.live === 0 && value.service.retiring === 0);
    assert.equal(cleaned.service.senders, 0); assert.equal(cleaned.service.watch, false);
    results.observations.push(cleaned);
  } else if (action === 'quit') {
    results.observations.push(await state());
    await main.evaluate('setTimeout(()=>globalThis.__probe57.quit(),50);true');
  } else if (action === 'restore') {
    await wait(state, Boolean);
    const saved = await state();
    assert.equal(saved.configuration.viewer.inspection, 'bottom');
    assert.equal(saved.configuration.profiles[0]?.name, 'Runtime saved profile');
    await wait(() => evaluate('__probe57.ready', root()), Boolean);
    const renderer = await evaluate('__probe57.data()', root());
    assert.deepEqual(renderer, saved.configuration);
    results.observations.push({ main: saved, renderer });
  } else if (action === 'toggle') {
    await evaluate("FreelensExtensionApi.Renderer.Navigation.navigate('/extensions');true", root());
    await sleep(300);
    results.observations.push(await evaluate("({text:document.body.innerText,buttons:[...document.querySelectorAll('button')].map(e=>({text:e.innerText,html:e.outerHTML.slice(0,700)})),inputs:[...document.querySelectorAll('input')].map(e=>e.outerHTML)})", root()));
  } else if (action === 'seed') {
    const reply = await evaluate(`(async()=>{const p=__probe57;const t=await p.rpc.invoke('open','lifecycle-57');p.lifecycleToken=t;return p.rpc.invoke('submit',t,{requestId:1,key:{viewerEpoch:1,targetEpoch:1,instanceEpoch:1,windowRevision:1,messageRevision:1,queryRevision:1},query:{text:'hello',matchCase:true,wholeWords:false},records:[{ref:{context:'lifecycle57',occurrence:0},application:'hello',message:'hello'}],work:'match'})})()`);
    assert.equal(reply.kind, 'matches');
    const seeded = await state(); assert(seeded.workers.live > 0);
    results.observations.push({ reply, seeded });
  } else if (action === 'frame-navigation') {
    const before = await state(); assert(before.workers.live > 0);
    await evaluate('setTimeout(()=>location.reload(),30);true');
    const cleaned = await wait(state, value => value.workers.live === 0 && value.service.owners === 0 && value.service.retiring === 0);
    assert.equal(cleaned.service.senders, 0); assert.equal(cleaned.service.watch, false);
    assert.equal(cleaned.workers.starts, cleaned.workers.exits);
    results.observations.push({ before, cleaned });
  } else if (action === 'identity') {
    const identity = await main.evaluate('({pid:process.pid,versions:process.versions,version:__probe57.version,host:FreelensExtensionApi.Common.App.version,manifest:__probe57.manifest,manifestPath:__probe57.manifestPath,profile:process.env.FREELENS_INTEGRATION_TESTING_DIR,appData:process.env.XDG_CONFIG_HOME})');
    assert.equal(identity.host, '2.0.1-0'); assert.equal(identity.versions.electron, '44.10.0'); assert.equal(identity.version, '0.0.58');
    results.observations.push(identity);
  } else if (action === 'disable' || action === 'enable') {
    await evaluate("FreelensExtensionApi.Renderer.Navigation.navigate('/extensions');true", root());
    await wait(() => evaluate("!!document.querySelector('[data-icon-name=more_vert]')", root()), Boolean);
    const label = action === 'disable' ? 'Disable' : 'Enabled';
    await evaluate(`(()=>{if(![...document.querySelectorAll('.MenuItem .title')].some(e=>e.textContent.trim()===${JSON.stringify(label)}))document.querySelector('[data-icon-name=more_vert]').click();return true})()`, root());
    await wait(() => evaluate(`[...document.querySelectorAll('.MenuItem .title')].some(e=>e.textContent.trim()===${JSON.stringify(label)})`, root()), Boolean);
    await evaluate(`[...document.querySelectorAll('.MenuItem .title')].find(e=>e.textContent.trim()===${JSON.stringify(label)}).click();true`, root());
    await wait(() => main.evaluate('globalThis.__probe57.isEnabled'), value => value === (action === 'enable'));
    if (action === 'disable') {
      const clean = await wait(state, value => value.workers.live === 0 && value.handlers.length === 0 && value.extensionListeners.length === 0);
      assert.deepEqual(clean.service, { owners: 0, retiring: 0, senders: 0, opening: 0, watch: false });
      assert.equal(clean.workers.starts, clean.workers.exits); assert.equal(clean.stops, 0);
      results.observations.push(clean);
    } else {
      await wait(() => evaluate('__probe57.ready', root()), Boolean);
      const enabled = await state(); assert.equal(enabled.handlers.length, 7); assert.equal(enabled.extensionListeners.length, 1);
      assert.equal(enabled.configuration.viewer.inspection, 'bottom');
      // A new value proves synchronization was reattached, rather than merely
      // reading a cached in-memory value left over from the first activation.
      await evaluate("__probe57.edit('inline','After re-enable');true", root());
      const synced = await wait(state, value => value.configuration.viewer.inspection === 'inline');
      const remote = await wait(() => evaluate('__probe57.data().viewer.inspection'), value => value === 'inline');
      await evaluate("__probe57.edit('bottom','Runtime saved profile');true", root());
      await wait(state, value => value.configuration.viewer.inspection === 'bottom');
      results.observations.push({ enabled, synced, remote, restored: await state() });
    }
  } else if (action === 'recover') {
    const before = await state(); assert(before.problem);
    const bytes = readFileSync(before.settingsPath);
    const expected = JSON.parse(readFileSync(directory + '/malformed-settings.json', 'utf8'));
    assert.equal(bytes.toString('hex'), expected.hex, 'Startup must preserve malformed bytes');
    const cancelled = await evaluate('__probe57.reset(false)', root());
    assert(cancelled.error); assert(readFileSync(before.settingsPath).equals(bytes));
    const reset = await evaluate('__probe57.reset(true)', root());
    assert(!reset.error && reset.backup); assert(readFileSync(reset.backup).equals(bytes));
    const recovered = await wait(state, value => !value.problem);
    const renderer = await evaluate('__probe57.data()', root());
    assert.deepEqual(renderer, recovered.configuration);
    assert.equal(renderer.viewer.inspection, 'side'); assert.equal(renderer.profiles.length, 0);
    results.observations.push({ problem: before.problem, originalHex: bytes.toString('hex'), cancelled, reset, recovered, renderer, backupExact: true });
  } else throw Error('Unknown probe');
  results.pass = true;
} catch (error) { results.pass = false; results.error = error.stack; process.exitCode = 1; }
finally {
  clearTimeout(timer); main?.close(); page?.close();
  writeFileSync(directory + '/' + action + '-' + Date.now() + '.json', JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
}
