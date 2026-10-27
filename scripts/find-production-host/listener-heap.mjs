// Retain only sanitized EventListener paths/IDs, never raw private-profile heaps.
import { readFileSync, writeFileSync, openSync, writeSync, closeSync, unlinkSync } from 'node:fs';
import assert from 'node:assert/strict';
import { scratch, evidence } from './config.mjs';
import { privateSession } from './private-session.mjs';

export async function listenerHeap(page, label) {
  assert(/^[a-z0-9-]+$/.test(label));
  privateSession();
  const path = `${scratch}/listeners-${label}.heapsnapshot`;
  const fd = openSync(path, 'wx', 0o600);
  const stop = page.subscribe(message => {
    if (message.method === 'HeapProfiler.addHeapSnapshotChunk') writeSync(fd, message.params.chunk);
  });
  try {
    try { await page.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false, exposeInternals: true }); }
    finally { stop(); closeSync(fd); }
    const heap = JSON.parse(readFileSync(path, 'utf8'));
    const { nodes, edges, strings } = heap, { meta } = heap.snapshot;
    const nf = meta.node_fields, ef = meta.edge_fields, nw = nf.length, ew = ef.length;
    const ni = Object.fromEntries(nf.map((name, i) => [name, i]));
    const ei = Object.fromEntries(ef.map((name, i) => [name, i]));
    const count = nodes.length / nw;
    const name = n => strings[nodes[n * nw + ni.name]];
    const type = n => meta.node_types[0][nodes[n * nw + ni.type]];
    const safeName = n => {
      const text = name(n);
      if (type(n) === 'native' && text.startsWith('<')) {
        const tag = text.match(/^<([a-zA-Z0-9]+)/)?.[1] ?? 'element';
        const classes = text.match(/\bclass="([\w .-]+)"/)?.[1];
        return `<${tag}${classes ? ' class="' + classes + '"' : ''}>`;
      }
      if (text.startsWith('Window /')) return 'Window';
      return /^[\w .:@()-]{0,100}$/.test(text) ? text : `[${type(n)} name omitted]`;
    };
    const offsets = new Uint32Array(count + 1);
    for (let n = 0; n < count; n++) offsets[n + 1] = offsets[n] + nodes[n * nw + ni.edge_count] * ew;
    const parent = new Int32Array(count).fill(-1), parentEdge = new Int32Array(count).fill(-1);
    const queue = new Uint32Array(count);
    let head = 0, tail = 1;
    queue[0] = 0; parent[0] = 0;
    while (head < tail) {
      const n = queue[head++];
      for (let e = offsets[n]; e < offsets[n + 1]; e += ew) {
        if (meta.edge_types[0][edges[e + ei.type]] === 'weak') continue;
        const to = edges[e + ei.to_node] / nw;
        if (parent[to] !== -1) continue;
        parent[to] = n; parentEdge[to] = e; queue[tail++] = to;
      }
    }
    const retainingPath = n => {
      const path = [];
      for (let at = n, depth = 0; at > 0 && parent[at] >= 0 && depth < 80; at = parent[at], depth++) {
        const e = parentEdge[at], edgeType = meta.edge_types[0][edges[e + ei.type]];
        const raw = ['element', 'hidden'].includes(edgeType) ? edges[e + ei.name_or_index] : strings[edges[e + ei.name_or_index]];
        path.push({ node: safeName(at), type: type(at), edgeType,
          edge: typeof raw === 'number' || /^[\w .:@()-]{0,100}$/.test(raw) ? raw : '[edge omitted]', from: safeName(parent[at]) });
      }
      return path.reverse();
    };
    const listeners = [], domNodes = [], nativeCounts = new Map();
    for (let n = 0; n < count; n++) {
      if (type(n) !== 'native') continue;
      nativeCounts.set(safeName(n), (nativeCounts.get(safeName(n)) ?? 0) + 1);
      if (name(n) === 'EventListener') {
        listeners.push({ id: nodes[n * nw + ni.id], reachable: parent[n] >= 0, path: retainingPath(n) });
      }
      if (name(n).startsWith('<') || /^(Text|Comment|HTMLDocument|DocumentFragment|HTML\w+Element|SVG\w+Element)$/.test(name(n))) {
        domNodes.push({ id: nodes[n * nw + ni.id], name: safeName(n),
          detachedness: ni.detachedness === undefined ? null : nodes[n * nw + ni.detachedness], path: retainingPath(n) });
      }
    }
    const result = { label, at: Date.now(), dom: await page.send('Memory.getDOMCounters'),
      scope: 'One shortest non-weak root path per native EventListener; IDs compare only within this renderer process. This is not a dominator analysis. Element attributes, strings, code and raw heap are excluded.',
      count: listeners.length, listeners, nativeCounts: Object.fromEntries(nativeCounts), domNodes };
    writeFileSync(`${evidence}/listener-heap-${label}.json`, JSON.stringify(result) + '\n');
    return { label, count: result.count, dom: result.dom };
  } finally { unlinkSync(path); }
}
