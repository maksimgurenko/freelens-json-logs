(() => {
  if (globalThis.__cv28Observation) throw Error('Ticket 28 observer already installed');
  const owner = () => ({
    at: new Date().toISOString(), url: location.href, historyLength: history.length,
    documentFocus: document.hasFocus(), visibility: document.visibilityState,
    focus: {tag: document.activeElement?.tagName, class: String(document.activeElement?.className ?? ''),
      label: document.activeElement?.getAttribute('aria-label') ?? (document.activeElement?.tagName === 'BUTTON' ? document.activeElement.textContent : undefined)},
    profiles: !!document.querySelector('.rl-profile-editor'),
    query: document.querySelector('#rl-find')?.value,
    selected: document.querySelector('.rl-selected')?.dataset.recordIndex ?? null,
    scrollTop: document.querySelector('.rl-records')?.scrollTop,
    confirmation: !![...document.querySelectorAll('.rl-profile-editor button')].find(e => e.textContent === 'Keep profile'),
    targetDetailsOpen: !!document.querySelector('.rl-target-context')?.open,
    rootVisible: !!document.querySelector('.readable-logs')?.getClientRects().length,
  });
  const cleanups = [];
  const record = phase => event => {
    if (typeof event.button === 'number' && event.button !== 3 && event.button !== 4) return;
    globalThis.__cv28TraceEvent(JSON.stringify({
      ...owner(), type: event.type, phase, trusted: event.isTrusted, cancelable: event.cancelable,
      defaultPrevented: event.defaultPrevented, button: event.button, buttons: event.buttons,
      pointerType: event.pointerType, x: event.clientX, y: event.clientY,
      target: {tag: event.target?.tagName, class: String(event.target?.className ?? '')},
    }));
  };
  for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'auxclick', 'popstate', 'hashchange', 'pagehide']) {
    for (const capture of [true, false]) {
      const listener = record(capture ? 'window capture' : 'window bubble');
      window.addEventListener(type, listener, {capture, passive: true});
      cleanups.push(() => window.removeEventListener(type, listener, capture));
    }
  }
  const timers = new Set();
  const afterDispatch = event => {
    if (event.button !== 3 && event.button !== 4) return;
    const timer = setTimeout(() => { timers.delete(timer); record('after dispatch')(event); }, 0);
    timers.add(timer);
  };
  for (const type of ['mouseup', 'auxclick']) {
    window.addEventListener(type, afterDispatch, {capture: true, passive: true});
    cleanups.push(() => window.removeEventListener(type, afterDispatch, true));
  }
  cleanups.push(() => { for (const timer of timers) clearTimeout(timer); });
  globalThis.__cv28Observation = {stop: () => { for (const cleanup of cleanups) cleanup(); }};
  return {...owner(), listenerCount: cleanups.length, observer: 'passive DOM/history only'};
})()
