// Follow one violating sample without a new workload or forced collection.
import { sleep } from './driver.mjs';

export async function retainedIdle(page, context, { initial, roots, nativeTrace = false }) {
  const start = performance.now(), result = { startedAt: Date.now(), initial, nativeTrace, samples: [],
    scope: 'Same failed sample; no navigation, new workload, heap snapshot, queryObjects or explicit GC during this comparison. Natural GC may still occur. Reachability without another GC is not proof of sustained retention.' };
  const events = new Map();
  let tracing = false, unsubscribe, complete, overflow = false;
  if (nativeTrace) {
    unsubscribe = page.subscribe(message => {
      if (message.method === 'Tracing.tracingComplete') complete?.();
      if (message.method !== 'Tracing.dataCollected') return;
      for (const e of message.params.value) {
        const type = e.args?.data?.type;
        if (!/scroll|lifecycle|animation|beginframe|gc/i.test(e.name) && !['scroll', 'scrollend'].includes(type)) continue;
        const key = JSON.stringify({ name: e.name, category: e.cat, type: ['scroll', 'scrollend'].includes(type) ? type : undefined });
        if (!events.has(key)) {
          if (events.size === 2048) { overflow = true; continue; }
          events.set(key, { count: 0, firstUs: e.ts, lastUs: e.ts });
        }
        const entry = events.get(key); entry.count++; entry.firstUs = Math.min(entry.firstUs, e.ts); entry.lastUs = Math.max(entry.lastUs, e.ts);
      }
    });
  }
  try {
    if (nativeTrace) {
      await page.send('Tracing.start', { categories: 'devtools.timeline,blink,cc,input,v8', options: 'record-continuously', transferMode: 'ReportEvents' });
      tracing = true;
    }
    for (const offsetMs of [0, 250, 1000, 5000, 15000]) {
      await sleep(Math.max(0, start + offsetMs - performance.now()));
      const sample = { offsetMs, elapsedMs: performance.now() - start, at: Date.now(), dom: await page.send('Memory.getDOMCounters'),
        renderer: await page.evaluate('({memory:process.memoryUsage(),timeline:document.timeline.currentTime,rows:document.querySelectorAll(".rl-record").length,highlights:CSS.highlights.size})', context) };
      if (roots) sample.viewerRoots = await roots.census();
      result.samples.push(sample);
    }
  } catch (error) { result.error = error.stack; }
  finally {
    try {
      if (tracing) {
        let timer;
        const ended = new Promise((resolve, reject) => { complete = resolve; timer = setTimeout(() => reject(Error('Idle native trace did not finish')), 10000); });
        try { await page.send('Tracing.end'); await ended; }
        finally { clearTimeout(timer); }
      }
    } catch (error) { result.cleanupError = error.stack; }
    finally { unsubscribe?.(); }
  }
  if (overflow) result.error ??= 'Idle native trace summary cap exceeded';
  result.nativeEvents = [...events].map(([key, counts]) => ({ ...JSON.parse(key), ...counts }));
  result.nativeScope = 'Sanitized renderer-process trace event names/counts/times only; trace begins after the violation. Scroll or lifecycle events may be observed, but absence does not prove a native queue is empty or identify which viewer it held. Tracing changes timing.';
  return result;
}
