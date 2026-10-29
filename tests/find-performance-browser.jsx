// Mounted production renderer + real worker: bounded scroll work and no blank
// retained highlights while a newer snapshot is still being matched.
export async function verifyFindPerformance({ root, rows, button, query, refresh, until, check, results, holdNext, holdNextRange, rangeRequests }) {
  const failures = [];
  const expect = (condition, message) => { if (!condition) failures.push(message); };
  const ranges = () => [...CSS.highlights].flatMap(([, highlight]) => [...highlight]);
  const frames = async (count = 2) => { for (let i = 0; i < count; i++) await new Promise(requestAnimationFrame); };
  button('Find');
  const hiddenFixture = ['{"message":"visible message","secret":"needle"}', '{"message":"other row"}'];
  await refresh(hiddenFixture.join('\n')); await query('needle');
  await until(() => root.querySelector('.rl-find-mark') && root.querySelector('.rl-match-hint'), 'Hidden matching row did not settle');
  const hint = root.querySelector('.rl-match-hint'), mark = root.querySelector('.rl-find-mark');
  const ordinal = root.querySelector('.rl-find-ordinal').textContent.trim();
  const pending = holdNext('needle');
  const append = refresh([...hiddenFixture, '{"message":"new nonmatching row"}'].join('\n'));
  try {
    await until(() => root.querySelector('.rl-find-count').textContent === 'Matching pending', 'Hidden-row append did not enter matching');
    await frames();
    expect(root.querySelector('.rl-find-ordinal').textContent.trim() === ordinal, 'Counter flickered while an unchanged matching row was retained');
    expect(hint.isConnected && root.querySelector('.rl-match-hint') === hint, 'Hidden-match link flickered on an unchanged row');
    expect(mark.isConnected && !root.querySelector('.rl-find-marks').hidden, 'Scrollbar match mark flickered on an unchanged row');
  } finally { pending.release(); await append; }
  results.push('counter, hidden-match link and scrollbar marks survive a delayed append on unchanged source text');
  const fixture = Array.from({ length: 1000 }, (_, index) => `needle ${index} ${'ordinary text '.repeat(12)}`);
  await refresh(fixture.join('\n')); await query('needle');
  const scroller = root.querySelector('.rl-records');
  scroller.scrollTop = 1000; await frames();
  await until(() => ranges().length && root.querySelector('.rl-highlight-status').getAttribute('aria-busy') !== 'true', 'Initial highlights did not settle');
  await frames();
  let styles = 0;
  const nativeStyle = globalThis.getComputedStyle;
  globalThis.getComputedStyle = (...args) => { styles++; return nativeStyle(...args); };
  const started = performance.now();
  try { scroller.scrollTop += 8; await frames(); } finally { globalThis.getComputedStyle = nativeStyle; }
  results.push({ scroll: { styleReads: styles, elapsedMs: performance.now() - started, records: rows().length } });
  expect(styles < 100, `Small scroll inspected offscreen source styles ${styles} times for 1000 rows`);
  await until(() => ranges().length && root.querySelector('.rl-highlight-status').getAttribute('aria-busy') !== 'true', 'Scrolled highlights did not settle');
  const retained = ranges()[0].startContainer;
  const beforeAppend = rangeRequests.length;
  let appendStyles = 0;
  globalThis.getComputedStyle = (...args) => { appendStyles++; return nativeStyle(...args); };
  const gate = holdNext('needle');
  const update = refresh([...fixture.slice(1), 'needle appended'].join('\n'));
  try {
    await until(() => root.querySelector('.rl-find-count').textContent === 'Matching pending', 'Snapshot did not enter matching');
    await frames();
    expect(retained.isConnected && ranges().some(range => range.startContainer === retained), 'Appending one log blanked highlights on unchanged visible text while matching');
  } finally { gate.release(); await update; globalThis.getComputedStyle = nativeStyle; }
  results.push('one-row append preserves native ranges on retained visible source nodes while the newer snapshot is matching');
  await until(() => ranges().length && root.querySelector('.rl-highlight-status').getAttribute('aria-busy') !== 'true', 'Appended highlights did not settle');
  await frames();
  expect(appendStyles < 100, `One-row append rebuilt clipping styles ${appendStyles} times`);
  expect(rangeRequests.length === beforeAppend, 'One-row append recomputed unchanged visible highlight coverage');
  results.push({ append: { styleReads: appendStyles, rangeRequests: rangeRequests.length - beforeAppend } });
  await refresh('needle ordinary '.repeat(500)); scroller.scrollLeft = 0; await query('needle');
  await until(() => ranges().length && root.querySelector('.rl-highlight-status').getAttribute('aria-busy') !== 'true', 'Long-row highlights did not settle'); await frames();
  const requests = rangeRequests.length;
  scroller.scrollLeft += 8; await frames(3);
  expect(rangeRequests.length === requests, 'Tiny horizontal scroll restarted worker decoration instead of reusing nearby ranges');
  const delayed = holdNextRange();
  scroller.scrollLeft = scroller.clientWidth * .75;
  try {
    await until(() => delayed.dispatched, 'Large horizontal scroll did not request newly visible ranges');
    await frames();
    const clip = scroller.getBoundingClientRect();
    expect(ranges().some(range => { const rect = range.getBoundingClientRect(); return rect.left < clip.right && rect.right > clip.left; }),
      'Scrolling blanked still-visible highlights while replacement decoration was pending');
  } finally { delayed.release(); }
  await until(() => root.querySelector('.rl-highlight-status').getAttribute('aria-busy') !== 'true', 'Delayed scroll highlights did not settle');
  results.push('small horizontal scroll reuses nearby ranges; a larger scroll preserves overlapping highlights while the next worker reply is held');
  const wrap = [...root.querySelectorAll('.rl-display-panel label')].find(label => label.textContent.includes('Word wrap')).querySelector('input');
  if (!wrap.checked) wrap.click();
  await refresh('ordinary '.repeat(240000) + ' Q'); await query('Q');
  scroller.scrollTop = Math.floor(scroller.scrollHeight / 2); await frames(4);
  await until(() => root.querySelector('.rl-highlight-status').getAttribute('aria-busy') !== 'true', 'Large wrapped-source decoration did not settle');
  let rectangles = 0;
  const nativeRects = Range.prototype.getClientRects;
  Range.prototype.getClientRects = function(...args) { rectangles++; return nativeRects.apply(this, args); };
  try { scroller.scrollTop += 8; await frames(2); } finally { Range.prototype.getClientRects = nativeRects; }
  results.push({ wrappedScroll: { rangeMeasurements: rectangles, sourceUnits: rows()[0].textContent.length } });
  expect(rectangles < 128, `Small scroll remeasured ${rectangles} text ranges across a 2 MiB wrapped source`);
  wrap.click();
  check(failures.length === 0, failures.join('; '));
}
