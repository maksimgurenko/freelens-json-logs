// Exercise the weak-root census through real DOM/CDP, before using its evidence.
import assert from 'node:assert/strict';
import { driver, report } from './driver.mjs';
import { weakViewerRoots } from './viewer-roots.mjs';
import { retainedIdle } from './retained-idle.mjs';

const d = await driver(), result = { pass: false };
let roots;
try {
  roots = await weakViewerRoots(d.page, d.cluster());
  await d.page.evaluate(`(()=>{
    const root=document.createElement('section');root.className='readable-logs diagnostic-owned';
    const child=document.createElement('div');child.className='diagnostic-child';root.append(child);
    root.onclick=()=>{};child.addEventListener('diagnostic-owned-event',()=>{});
    document.body.append(root);global.__viewerRootsCheck=root;return true;
  })()`, d.cluster());
  await roots.capture();
  result.connected = await roots.census();
  const live = result.connected.roots.find(r => r.target.includes('diagnostic-owned'));
  assert.equal(live.connected, true);
  assert.equal(live.nodes, 2);
  assert.deepEqual(live.listeners.map(l => l.type).sort(), ['click', 'diagnostic-owned-event']);
  await d.page.evaluate('global.__viewerRootsCheck.remove();true', d.cluster());
  result.detached = await roots.census();
  const detached = result.detached.roots.find(r => r.id === live.id);
  assert.equal(detached.connected, false);
  assert.equal(detached.nodes, 2);
  assert.equal(detached.listeners.length, 2, 'Assigned and registered subtree handlers are observed');
  assert(detached.listeners.every(l => l.target && Number.isInteger(l.line)));
  if (process.env.FIND_ROOTS_CHECK_IDLE === '1') {
    result.idle = await retainedIdle(d.page, d.cluster(), { initial: result.detached.after, roots, nativeTrace: true });
    assert(!result.idle.error && !result.idle.cleanupError, 'Idle comparison must finish and stop tracing');
    assert.equal(result.idle.samples.length, 5);
    assert(result.idle.samples.every(s => s.viewerRoots.roots.some(r => r.id === live.id && !r.connected && r.listeners.length === 2)));
    // This check deliberately owns its detached root strongly; it verifies
    // observation, without pretending the held root should be collected.
  }
  await d.page.evaluate('global.__viewerRootsCheck.onclick=null;global.__viewerRootsCheck.replaceChildren();true', d.cluster());
  result.removed = await roots.census();
  assert.equal(result.removed.roots.find(r => r.id === live.id).listeners.length, 0);
  result.pass = true;
} catch (error) { result.error = error.stack; process.exitCode = 1; }
finally {
  try {
    await d.page.evaluate('global.__viewerRootsCheck?.remove();delete global.__viewerRootsCheck;true', d.cluster());
    if (roots) await roots.dispose();
    result.restored = await d.page.evaluate('!global.__findViewerRoots', d.cluster());
    assert.equal(result.restored, true);
  } catch (error) { result.cleanupError = error.stack; result.pass = false; process.exitCode = 1; }
  report('viewer-roots-check', result);
  console.log(JSON.stringify({ pass: result.pass, error: result.error, cleanupError: result.cleanupError }));
  d.close();
}
