// Private-host diagnostic only. Capture attached listener locations without
// retaining inspector handles, log text, source code, or private profile data.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { evidence } from './config.mjs';
import { privateSession } from './private-session.mjs';

export async function listenerCensus(page, label) {
  assert(/^[a-z0-9-]+$/.test(label));
  privateSession();
  const scripts = new Map();
  const unsubscribe = page.subscribe(message => {
    if (message.method === 'Debugger.scriptParsed') {
      const { scriptId, url } = message.params;
      scripts.set(scriptId, url.includes('/out/renderer-') ? 'extension-renderer'
        : url.includes('app.asar') ? 'host-asar'
          : /^https:\/\/([^.]+\.)?renderer\.freelens\.app:\d+\//.test(url) ? 'host-renderer'
            : url ? 'other-script' : 'anonymous');
    }
  });
  const counts = new Map(), objectIds = new Set();
  try {
    await page.send('Debugger.enable');
    for (const context of [...page.contexts.values()].filter(c => c.auxData?.isDefault)) {
      for (const target of ['document', 'window']) {
        const object = await page.send('Runtime.evaluate', {
          expression: target, contextId: context.id, objectGroup: 'find-listener-census',
        });
        if (!object.result.objectId) continue;
        const { listeners } = await page.send('DOMDebugger.getEventListeners', {
          objectId: object.result.objectId, depth: target === 'document' ? -1 : 0, pierce: false,
        });
        const nodes = new Map();
        for (const listener of listeners) {
          for (const key of ['handler', 'originalHandler']) {
            if (listener[key]?.objectId) objectIds.add(listener[key].objectId);
          }
          let node = target;
          if (listener.backendNodeId) {
            if (!nodes.has(listener.backendNodeId)) {
              const { node: info } = await page.send('DOM.describeNode', { backendNodeId: listener.backendNodeId });
              // Keep only element names/classes: never hrefs, values, text or IDs.
              const attributes = info.attributes ?? [];
              const at = attributes.indexOf('class');
              nodes.set(listener.backendNodeId, info.nodeName + (at >= 0 ? '.' + attributes[at + 1].split(/\s+/).join('.') : ''));
            }
            node = nodes.get(listener.backendNodeId);
          }
          const row = { frame: /^https:\/\/renderer\./.test(context.origin) ? 'root' : 'cluster',
            type: listener.type, target: node, capture: listener.useCapture,
            script: scripts.get(listener.scriptId) ?? 'unknown', line: listener.lineNumber, column: listener.columnNumber };
          const key = JSON.stringify(row);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
    }
    const rows = [...counts].map(([key, count]) => ({ ...JSON.parse(key), count }));
    const result = { label, at: Date.now(), dom: await page.send('Memory.getDOMCounters'),
      scope: 'Attached document subtree and Window listeners in each default renderer context. Detached/native-only targets require heap paths; this census is not the global listener counter.',
      total: rows.reduce((n, row) => n + row.count, 0), rows };
    writeFileSync(`${evidence}/listeners-${label}.json`, JSON.stringify(result, null, 2) + '\n');
    return { label, total: result.total, dom: result.dom };
  } finally {
    for (const objectId of objectIds) await page.send('Runtime.releaseObject', { objectId });
    await page.send('Runtime.releaseObjectGroup', { objectGroup: 'find-listener-census' });
    await page.send('Debugger.disable');
    unsubscribe();
  }
}
