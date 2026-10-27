// Optional private-host attribution: observe new abort registrations without
// replacing callbacks or retaining targets. Original methods are always restored.
import assert from 'node:assert/strict';
import { privateSession } from './private-session.mjs';

export async function traceAbortListeners(page) {
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
          if(this instanceof AbortSignal && type==='abort' && callback && (typeof callback==='function'||typeof callback==='object')){
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
