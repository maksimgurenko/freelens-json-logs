// Check the real private output and natural renderer frames without screenshots.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { driver, report } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { scratch } from './config.mjs';

export async function checkFrameCadence(d) {
  const result = { session: privateSession(), scope: 'Private output/DOM cadence only; no native input or latency claim.' };
  const info = JSON.parse(readFileSync(`${scratch}/session.json`, 'utf8'));
  result.monitors = JSON.parse(execFileSync('hyprctl', ['monitors', '-j'], {
    env: { ...process.env, ...info.environment }, encoding: 'utf8', timeout: 2_000,
  }));
  assert(result.monitors.some(m => !m.disabled && m.width > 0 && m.height > 0));
  result.renderer = await d.page.evaluate(`new Promise(resolve => {
    const times = []; let frame;
    const finish = () => { clearTimeout(timer); cancelAnimationFrame(frame);
      resolve({times, visibility: document.visibilityState, focused: document.hasFocus(),
        width: innerWidth, height: innerHeight}); };
    const tick = time => { times.push(time); if (times.length === 61) finish();
      else frame = requestAnimationFrame(tick); };
    const timer = setTimeout(finish, 3_000); frame = requestAnimationFrame(tick);
  })`, d.cluster());
  assert.equal(result.renderer.times.length, 61, 'Natural frame delivery did not complete in 3 seconds');
  result.gapsMs = result.renderer.times.slice(1).map((time, i) => time - result.renderer.times[i]);
  result.pass = true;
  return result;
}

if (process.argv[1]?.endsWith('/frame-cadence.mjs')) {
  const d = await driver();
  let result;
  try { result = await checkFrameCadence(d); }
  catch (error) { result = { pass: false, error: error.stack }; process.exitCode = 1; }
  finally { report('frame-cadence', result); console.log(JSON.stringify(result)); d.close(); }
}
