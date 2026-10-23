(async () => {
  const h = global.__rl19, { assert, tick, root, button, state, requests } = h;
  const container = state().container, route = location.pathname + location.search;
  const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
  const painted = async () => { await frame(); await frame(); };
  const measure = async () => {
    const previous = state().snapshot, before = requests.length;
    const action = performance.now(); button('Resume').click();
    await h.settled(previous);
    const usable = performance.now();
    const row = root().querySelector('.rl-row'); assert(row && row.getBoundingClientRect().height > 0, 'No usable row geometry');
    await painted(); const afterPaint = performance.now(), request = requests.at(-1);
    assert(requests.length === before + 1 && request.status === 200 && request.responseCompleted, 'Missing real response timestamp');
    const pauseStart = performance.now(); button('Pause').click();
    for (let i = 0; !button('Resume') && i < 1000; i++) await tick(1);
    assert(button('Resume') && state().paused, 'Pause not reflected');
    const pauseDom = performance.now(); await painted(); const pausePaint = performance.now();
    const rows = root().querySelectorAll('.rl-row').length;
    const navStart = performance.now(); global.LensExtensions.Renderer.Navigation.navigate('/pods');
    for (let i = 0; root() && i < 1000; i++) await tick(1);
    assert(!root() && location.pathname === '/pods', 'Navigation failed');
    const navDom = performance.now(); await painted(); const navPaint = performance.now();
    const result = { container, rows, responseBytes: Buffer.byteLength(request.body), networkWaitMs: request.responseCompleted - request.started,
      responseToUsableDomMs: usable - request.responseCompleted, responseThroughPaintOpportunityMs: afterPaint - request.responseCompleted,
      actionToResponseMs: request.responseCompleted - action, pauseDomMs: pauseDom - pauseStart, pauseThroughPaintOpportunityMs: pausePaint - pauseStart,
      navigationDomMs: navDom - navStart, navigationThroughPaintOpportunityMs: navPaint - navStart };
    global.LensExtensions.Renderer.Navigation.navigate(route);
    for (let i = 0; (!root() || !state().snapshot) && i < 1000; i++) await tick(1);
    assert(root() && state().snapshot, 'Reopen did not fetch');
    if (state().container !== container) { await h.input('Container', container); for (let i = 0; (state().container !== container || !state().snapshot || state().refreshing) && i < 1000; i++) await tick(1); }
    if (button('Pause')) await h.click('Pause');
    return result;
  };
  const warmup = await measure(), runs = [];
  for (let i = 0; i < 5; i++) runs.push(await measure());
  return { host: global.LensExtensions.Common.Util.getAppVersion(), version: root().dataset.version, visible: document.visibilityState,
    warmupExcluded: warmup, runs, thresholds: { responseMs: 1000, pauseAndNavigationMs: 100 },
    allWithinTargets: runs.every(r => r.responseThroughPaintOpportunityMs <= 1000 && r.pauseThroughPaintOpportunityMs <= 100 && r.navigationThroughPaintOpportunityMs <= 100),
    method: 'performance.now in actual renderer; prepended real Node response end before SDK completion; DOM geometry then two requestAnimationFrame opportunities; native focused workspace-7 window; no synthetic responses' };
})()
