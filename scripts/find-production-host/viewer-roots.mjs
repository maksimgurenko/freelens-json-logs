// Diagnostic only: one bounded weak reference per mounted viewer. No callback
// wrapping, target handles between censuses, heap snapshots or collection.
import assert from 'node:assert/strict';
import { privateSession } from './private-session.mjs';

export async function weakViewerRoots(page, context) {
  privateSession();
  await page.evaluate(`(()=>{
    if(global.__findViewerRoots)throw Error('Viewer-root diagnostic already installed');
    const trace={records:[],seen:new WeakSet(),nextId:0};
    trace.capture=()=>{
      for(const root of document.querySelectorAll('.readable-logs')){
        if(trace.seen.has(root))continue;
        if(trace.records.length===256)throw Error('Weak viewer-root cap exceeded');
        trace.seen.add(root);trace.records.push({id:++trace.nextId,root:new WeakRef(root)});
      }
      return {captured:trace.records.length};
    };
    global.__findViewerRoots=trace;return true;
  })()`, context);
  return {
    async capture() {
      return page.evaluate('global.__findViewerRoots.capture()', context);
    },
    async census() {
      const startedAt = Date.now();
      const before = await page.send('Memory.getDOMCounters');
      const group = 'find-weak-viewer-roots', handles = new Set(), roots = [];
      let captured;
      try {
        const targets = await page.send('Runtime.evaluate', {
          expression: `(()=>{const t=global.__findViewerRoots;return {captured:t.records.length,roots:t.records.flatMap(r=>{const root=r.root.deref();return root?[{id:r.id,root}]:[]})}})()`,
          contextId: context.id, objectGroup: group,
        });
        assert(!targets.exceptionDetails && targets.result.objectId, 'Cannot dereference viewer roots');
        const props = await page.send('Runtime.getProperties', { objectId: targets.result.objectId, ownProperties: true });
        captured = props.result.find(p => p.name === 'captured').value.value;
        const list = props.result.find(p => p.name === 'roots').value.objectId;
        const entries = await page.send('Runtime.getProperties', { objectId: list, ownProperties: true });
        for (const entry of entries.result.filter(p => /^\d+$/.test(p.name))) {
          const metadata = await page.send('Runtime.callFunctionOn', { objectId: entry.value.objectId,
            functionDeclaration: `function(){const r=this.root,w=document.createTreeWalker(r,NodeFilter.SHOW_ALL);let nodes=1;while(w.nextNode())nodes++;return {id:this.id,connected:r.isConnected,target:r.nodeName+'.'+r.className.trim().split(/\\s+/).join('.'),nodes}}`, returnByValue: true });
          assert(!metadata.exceptionDetails, 'Cannot inspect viewer root');
          const target = await page.send('Runtime.callFunctionOn', { objectId: entry.value.objectId,
            functionDeclaration: 'function(){return this.root}', objectGroup: group });
          assert(!target.exceptionDetails && target.result.objectId, 'Cannot resolve viewer root');
          const { node } = await page.send('DOM.describeNode', { objectId: target.result.objectId });
          const { listeners } = await page.send('DOMDebugger.getEventListeners', { objectId: target.result.objectId, depth: -1, pierce: false });
          // Returned handler handles are outside our object group. Release them
          // even when a subsequent describeNode or validation fails.
          for (const l of listeners) for (const key of ['handler', 'originalHandler']) if (l[key]?.objectId) handles.add(l[key].objectId);
          const nodes = new Map(), rows = [];
          for (const l of listeners) {
            if (!nodes.has(l.backendNodeId)) {
              const { node: n } = await page.send('DOM.describeNode', { backendNodeId: l.backendNodeId });
              const attrs = n.attributes ?? [], at = attrs.indexOf('class');
              nodes.set(l.backendNodeId, n.nodeName + (at < 0 ? '' : '.' + attrs[at + 1].trim().split(/\s+/).join('.')));
            }
            rows.push({ type: l.type, capture: l.useCapture, once: l.once, passive: l.passive,
              backendNodeId: l.backendNodeId, target: nodes.get(l.backendNodeId), scriptId: l.scriptId, line: l.lineNumber, column: l.columnNumber });
          }
          roots.push({ ...metadata.result.value, backendNodeId: node.backendNodeId, listeners: rows });
        }
      } finally {
        try {
          const released = await Promise.allSettled([...handles].map(objectId => page.send('Runtime.releaseObject', { objectId })));
          assert(released.every(r => r.status === 'fulfilled'), 'Cannot release census handler handles');
        } finally { await page.send('Runtime.releaseObjectGroup', { objectGroup: group }); }
      }
      return { startedAt, elapsedMs: Date.now() - startedAt, before, after: await page.send('Memory.getDOMCounters'), captured, reachable: roots.length,
        roots, scope: 'Weakly captured mounted viewer roots and non-piercing subtrees only. Assigned and registered attached handlers; no heap capture or explicit GC. Temporary inspector handles released before return.' };
    },
    async dispose() { await page.evaluate('delete global.__findViewerRoots;true', context); },
  };
}
