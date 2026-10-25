(async () => {
  if (global.__rl19) throw Error('Release probe already installed');
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const tick = (ms = 25) => new Promise(resolve => setTimeout(resolve, ms));
  const root = () => document.querySelector('.readable-logs');
  for (let i = 0; i < 120 && !root()?.querySelectorAll('.rl-row').length; i++) await tick(100);
  assert(root()?.dataset.version === '0.1.33', 'Wrong package');
  const button = text => [...root().querySelectorAll('button')].find(el => el.textContent === text);
  const click = async text => { const el = button(text); assert(el && !el.disabled, 'Unavailable ' + text); el.click(); await tick(); };
  const input = async (label, value) => {
    const el = root().querySelector(`input[aria-label="${label}"], select[aria-label="${label}"], textarea[aria-label="${label}"]`);
    assert(el && !el.disabled, 'Unavailable ' + label);
    const prototype = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); await tick();
  };
  const state = () => {
    let fiber = root()[Object.keys(root()).find(key => key.startsWith('__reactFiber$'))];
    while (fiber?.return) fiber = fiber.return;
    const stack = [fiber.stateNode.current];
    while (stack.length) { const candidate = stack.pop(); if (candidate.memoizedProps?.target && candidate.memoizedProps?.preferences) { fiber = candidate; break; } if (candidate.sibling) stack.push(candidate.sibling); if (candidate.child) stack.push(candidate.child); }
    for (let hook = fiber?.memoizedState; hook; hook = hook.next) if (hook.memoizedState?.containers && hook.memoizedState?.phase) return hook.memoizedState;
    return {}; // A newly mounted Viewer has no session state until its effect runs.
  };
  if (button('Pause')) await click('Pause');
  const requests = [], restores = [];
  const probe = { assert, tick, root, button, click, input, state, requests, denied: false, offline: false, expandedTail: false };
  for (const protocol of ['http', 'https']) {
    const mod = require(protocol), original = mod.request;
    mod.request = function (...args) {
      const first = args[0];
      const originalPath = typeof first === 'string' ? first : first instanceof URL ? first.href : first?.path;
      const owned = /\/namespaces\/readable-logs-ticket-30\/pods\/release\/log(?:\?|$)/.test(originalPath ?? '') && originalPath.includes('tailLines=1000');
      if (owned && (probe.expandedTail || probe.offline)) {
        if (typeof first === 'string' || first instanceof URL) { const url = new URL(first); if (probe.expandedTail) url.searchParams.set('tailLines', '1100'); if (probe.offline) url.port = '9'; args[0] = url; }
        else args[0] = { ...first, ...(probe.offline ? { port: 9 } : {}), path: probe.expandedTail ? first.path.replace('tailLines=1000', 'tailLines=1100') : first.path };
      }
      if (owned && (probe.expandedTail || probe.offline)) for (let index=1; index<args.length; index++) if (args[index] && typeof args[index] === 'object') args[index] = { ...args[index], ...(probe.offline ? { port: 9 } : {}), ...(probe.expandedTail && typeof args[index].path === 'string' ? { path: args[index].path.replace('tailLines=1000', 'tailLines=1100') } : {}) };
      const request = original.apply(this, args);
      if (owned) {
        const record = { originalPath, transmittedPath: request.path, started: performance.now(), denied: probe.denied, offline: probe.offline };
        requests.push(record);
        if (probe.denied) request.setHeader('Impersonate-User', 'freelens-readable-logs-ticket-30-denied');
        request.prependListener('response', response => {
          record.status = response.statusCode;
          const chunks = [];
          response.on('data', chunk => chunks.push(Buffer.from(chunk)));
          response.prependListener('end', () => { record.responseCompleted = performance.now(); record.body = Buffer.concat(chunks).toString('utf8'); });
        });
        request.on('error', error => { record.error = error.message; record.responseCompleted = performance.now(); });
      }
      return request;
    };
    restores.push(() => { mod.request = original; });
  }
  probe.settled = async previous => { for (let i = 0; i < 2000; i++) { const s = state(); if (s.snapshot !== previous && !s.refreshing && !s.waiting) return s; if (s.error) throw Error(s.error); await tick(1); } throw Error('No accepted real snapshot'); };
  probe.refresh = async () => { const previous = state().snapshot, count = requests.length; await click('Refresh'); await probe.settled(previous); assert(requests.length === count + 1, 'Expected one real read'); return requests.at(-1); };
  probe.summary = r => ({ ...r, body: undefined, bytes: r.body === undefined ? undefined : Buffer.byteLength(r.body), sha256: r.body === undefined ? undefined : require('crypto').createHash('sha256').update(r.body).digest('hex') });
  probe.restore = () => { for (const restore of restores) restore(); delete global.__rl19; };
  global.__rl19 = probe;
  return { host: global.LensExtensions.Common.Util.getAppVersion(), version: root().dataset.version, paused: !!button('Resume'), rows: root().querySelectorAll('.rl-row').length, container: state().container, note: 'Real owned-endpoint responses only; prepend end timestamp before SDK end handlers; no body substitution' };
})()
