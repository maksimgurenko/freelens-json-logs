// Optional private-host attribution: observe new abort registrations without
// replacing callbacks or retaining targets. Original methods are always restored.
import assert from 'node:assert/strict';
import { privateSession } from './private-session.mjs';

export async function traceAbortListeners(page, { allTargets = false } = {}) {
  privateSession();
  const contexts = [...page.contexts.values()].filter(c => c.auxData?.isDefault);
  const installed = [];
  try {
    for (const context of contexts) {
      await page.evaluate(`(()=>{
        if(global.__findAbortTrace)throw Error('Abort diagnostic already installed');
        const prototype=EventTarget.prototype,original=prototype.addEventListener,records=[],ids=new WeakMap();let nextId=0;
        const trace={prototype,original,records,ids,dropped:0};
        trace.wrapper=function(type,callback,options){
          const result=Reflect.apply(original,this,arguments);
          if((${allTargets} || this instanceof AbortSignal && type==='abort') && callback && (typeof callback==='function'||typeof callback==='object')){
            if(!ids.has(this))ids.set(this,++nextId);
            const frames=new Error().stack.split('\\n').slice(2,7).map(frame=>{
              const location=frame.match(/:(\\d+):(\\d+)\\)?$/);
              return {source:frame.includes('/out/renderer-')?'extension-renderer':frame.includes('app.asar')?'host-asar':frame.includes('renderer.freelens.app:')?'host-renderer':frame.includes('node:')?'node-internal':'other',line:location?Number(location[1]):null,column:location?Number(location[2]):null};
            });
            if(records.length===8192){records.shift();trace.dropped++;}
            records.push({signal:new WeakRef(this),callback:new WeakRef(callback),id:ids.get(this),frames});
          }
          return result;
        };
        prototype.addEventListener=trace.wrapper;global.__findAbortTrace=trace;return true;
      })()`, context);
      installed.push(context);
    }
  } catch (error) {
    for (const context of installed) await restore(context);
    throw error;
  }
  async function restore(context) {
    await page.evaluate(`(()=>{const trace=global.__findAbortTrace;if(!trace)return true;if(trace.prototype.addEventListener!==trace.wrapper)throw Error('Abort diagnostic method changed');trace.prototype.addEventListener=trace.original;delete global.__findAbortTrace;return true})()`, context);
  }
  return {
    async attached() {
      // Unlike queryObjects/takeHeapSnapshot this does not request a GC. Hold
      // reachable targets only during this census, then release every handle.
      const before = await page.send('Memory.getDOMCounters');
      const samples = [], handles = new Set();
      const group = 'find-abort-listener-census';
      try {
        for (const context of installed) {
          const targets = await page.send('Runtime.evaluate', {
            expression: `(()=>{const trace=global.__findAbortTrace;if(trace.dropped)throw Error('Abort diagnostic buffer filled');const targets=new Map();for(const r of trace.records){const signal=r.signal.deref();if(signal&&!targets.has(r.id))targets.set(r.id,{id:r.id,signal,frames:r.frames});}if(targets.size>2048)throw Error('Abort census target cap exceeded');return [...targets.values()]})()`,
            contextId: context.id, objectGroup: group,
          });
          assert(!targets.exceptionDetails, 'Abort census could not collect targets');
          const entries = await page.send('Runtime.getProperties', { objectId: targets.result.objectId, ownProperties: true });
          const rows = [];
          for (const entry of entries.result.filter(p => /^\d+$/.test(p.name))) {
            const info = await page.send('Runtime.callFunctionOn', { objectId: entry.value.objectId,
              functionDeclaration: `function(){const t=this.signal;return {id:this.id,frames:this.frames,aborted:t instanceof AbortSignal?t.aborted:null,target:t.nodeName?(t.nodeName+(typeof t.className==='string'?'.'+t.className.trim().split(/\\s+/).join('.') : '')):t.constructor.name,connected:typeof t.isConnected==='boolean'?t.isConnected:null}}`, returnByValue: true });
            const target = await page.send('Runtime.callFunctionOn', { objectId: entry.value.objectId,
              functionDeclaration: 'function(){return this.signal}', objectGroup: group });
            const { listeners } = await page.send('DOMDebugger.getEventListeners', {
              objectId: target.result.objectId, depth: allTargets ? -1 : 0, pierce: false,
            });
            for (const listener of listeners) {
              for (const key of ['handler', 'originalHandler']) if (listener[key]?.objectId) handles.add(listener[key].objectId);
            }
            rows.push({ ...info.result.value, listeners: listeners.map(l => ({ type: l.type, capture: l.useCapture,
              once: l.once, passive: l.passive, backendNodeId: l.backendNodeId, scriptId: l.scriptId, line: l.lineNumber, column: l.columnNumber })) });
          }
          // Ancestor/descendant censuses overlap. Keep the greatest multiplicity
          // per native target/type/handler location, rather than summing repeats.
          const unique = new Map();
          for (const row of rows) {
            const local = new Map();
            for (const l of row.listeners) {
              const key = JSON.stringify([l.backendNodeId ?? `target-${row.id}`, l.type, l.capture, l.scriptId, l.line, l.column]);
              local.set(key, (local.get(key) ?? 0) + 1);
            }
            for (const [key, count] of local) unique.set(key, Math.max(unique.get(key) ?? 0, count));
          }
          samples.push({ frame: /^https:\/\/renderer\./.test(context.origin) ? 'root' : 'cluster',
            targets: rows.length, attached: [...unique.values()].reduce((n, count) => n + count, 0), rows });
        }
        return { before, after: await page.send('Memory.getDOMCounters'), samples,
          scope: `${allTargets ? 'Reachable EventTargets and their non-piercing DOM subtrees' : 'Reachable AbortSignal targets'} registered since trace installation; actual attached listeners at census time, overlaps counted once by target/type/handler location and maximum multiplicity. No heap capture or explicit GC. Instrumented diagnostic, not a global census.` };
      } finally {
        try { await Promise.all([...handles].map(objectId => page.send('Runtime.releaseObject', { objectId }))); }
        finally { await page.send('Runtime.releaseObjectGroup', { objectGroup: group }); }
      }
    },
    async sample() {
      const samples=[];
      for(const context of installed){
        const value=await page.evaluate(`(()=>{const trace=global.__findAbortTrace;return {registered:trace.records.length,dropped:trace.dropped,live:trace.records.flatMap(record=>{const signal=record.signal.deref();return signal&&record.callback.deref()?[{id:record.id,aborted:signal.aborted,frames:record.frames}]:[]})}})()`,context);
        assert.equal(value.dropped,0,'Abort diagnostic buffer filled');
        samples.push({frame:/^https:\/\/renderer\./.test(context.origin)?'root':'cluster',...value});
      }
      return samples;
    },
    async dispose() { for(const context of installed)await restore(context); },
  };
}
