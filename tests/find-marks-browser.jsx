// Mounted production renderer + real layout/worker; no native input/clipboard.
export async function verifyFindMarks({ root, rows, button, query, refresh, until, check, turn, results, failRanges }) {
  const marks = () => [...root.querySelectorAll('.rl-find-mark')];
  const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const current = () => Number(root.querySelector('.rl-find-current')?.dataset.recordIndex ?? -1);
  const scroller = root.querySelector('.rl-records');
  const population = () => marks().reduce((sum, mark) => sum + Number(/Find (\d+) matching records/.exec(mark.getAttribute('aria-label'))?.[1] ?? 1), 0);
  const display = name => { root.querySelector('.rl-display-options').open = true; button(name); root.querySelector('.rl-display-options').open = false; };
  const wrap = [...root.querySelectorAll('.rl-display-panel label')].find(label => label.textContent.includes('Word wrap')).querySelector('input');
  const layout = root.querySelector('select[aria-label="Inspection"]');
  const selectLayout = async value => { layout.value = value; layout.dispatchEvent(new Event('change', { bubbles: true })); await frames(); };
  const geometry = () => {
    check(population() === 3, 'Geometry lost exact matching members');
    const start = scroller.getBoundingClientRect().top + scroller.clientTop;
    for (const i of [0, 64, 120]) {
      const mark = marks().find(mark => mark.getAttribute('aria-label') === `Find matching record ${[0, 64, 120].indexOf(i) + 1} of 3`);
      check(mark, `Missing separate measured mark for ${i}`);
      const coordinate = rows()[i].getBoundingClientRect().top - start + scroller.scrollTop;
      const projected = coordinate / scroller.scrollHeight * scroller.clientHeight;
      check(Math.abs(parseFloat(mark.style.top) - projected) <= 14, `Mark ignored real row geometry at ${i}`);
    }
  };
  button('Find');
  root.querySelector('[aria-label="Close record inspector"]')?.click();
  await refresh(Array.from({ length: 1000 }, (_, i) => `needle ${i}`).join('\n'));
  await query('needle');
  await until(() => marks().length > 0, 'No measured Find marks');
  check(marks().length < 1000, 'Coincident marks were not grouped');
  const first = marks()[0];
  check(first.getAttribute('aria-label').includes('cycle'), 'Grouped mark does not explain cycling');
  const members = Number(/Find (\d+) matching records/.exec(first.getAttribute('aria-label'))[1]);
  for (let i = 0; i <= members; i++) {
    first.click(); await frames();
    check(current() === i % members, 'Repeated clicks did not cycle every ordered member');
  }
  check(population() === 1000, 'Marks lost members under decoration caps');
  check(first.getAttribute('aria-current') === 'true' && getComputedStyle(first, '::before').borderTopWidth === '1px', 'Active group has no non-color distinction');
  check(document.activeElement === root.querySelector('#rl-find'), 'Mark did not focus Find');
  check(!root.querySelector('.rl-detail'), 'Mark opened inspection');
  // Growth can split a group between click dispatch and the queued measurement.
  // This explicit action still addresses its original retained member.
  rows()[0].style.minHeight = '4000px';
  first.click(); await frames();
  check(current() === 1, 'Click-time regrouping discarded its still-live target');
  rows()[0].style.minHeight = ''; await frames();
  root.querySelector('[aria-label="Search history"]').click(); await turn();
  check(root.querySelector('.rl-history-text')?.textContent === 'needle', 'Mark navigation did not commit history');
  root.querySelector('[aria-label="Close search history"]').click();
  results.push('measured seven-pixel grouped marks cycle ordered members and focus Find without inspection');

  failRanges(); await query('need');
  await until(() => root.querySelector('.rl-highlight-status')?.textContent.includes('Retry highlights'), 'Controlled decoration failure missing');
  await frames(); check(population() === 1000, 'Decoration failure removed exact scrollbar members');
  const dismissed = marks()[0], beforeDismissal = scroller.scrollTop;
  root.querySelector('[aria-label="Close Find"]').click(); dismissed.click(); await frames();
  check(marks().length === 0 && scroller.scrollTop === beforeDismissal, 'Dismissed geometry replayed a reveal');
  button('Find'); await frames(); check(scroller.scrollTop === beforeDismissal, 'Reopen replayed a mark action');
  const evicted = marks()[0];
  await refresh('unrelated\nneedle 0'); await frames();
  evicted.click(); await frames(); check(current() === -1, 'Evicted group addressed an equal-looking new occurrence');
  results.push('all 1000 exact members survive decoration caps/failure; dismissed/evicted buttons cannot replay or target equal text');
  button('Retry highlights');

  const lines = Array.from({ length: 180 }, (_, i) => [0, 64, 120].includes(i) ? `needle ${i}` : `ordinary ${i}`);
  lines[10] = JSON.stringify({ message: 'long '.repeat(4000), hidden: 'generated presentation' });
  lines[64] = '{"message":"visible","secret":"needle"}';
  await refresh(lines.join('\n')); await query('needle');
  if (!wrap.checked) wrap.click(); await frames(); geometry();
  const longHeight = rows()[10].getBoundingClientRect().height;
  check(longHeight > 100, 'Fixture did not wrap long source');
  const beforeResize = marks().map(mark => mark.style.top).join(',');
  root.style.width = '390px'; await frames(); geometry();
  check(beforeResize !== marks().map(mark => mark.style.top).join(','), 'Resize did not invalidate measured geometry');
  root.style.width = '1440px'; await frames();
  await selectLayout('inline'); rows()[10].querySelector('.rl-row').click(); await frames(); geometry();
  check(rows()[10].querySelector('.rl-detail'), 'Inline inspector fixture missing');
  const inspected = root.querySelector('.rl-selected');
  // Mark navigation preserves independent inspection/reading state and Pause.
  marks().at(-1).click(); await frames();
  check(current() === 120 && root.querySelector('.rl-selected') === inspected && root.querySelector('.rl-update-status').textContent === 'Paused', 'Mark changed inspection or Pause');
  button('Clear'); await query('needle'); check(current() === 64, 'Mark replaced independent reading row');
  root.querySelector('[aria-label="Close record inspector"]').click(); await frames(); geometry();
  const hint = rows()[64].querySelector('.rl-match-hint'); hint.click(); await frames(); geometry();
  check(root.querySelector('.rl-detail pre').textContent === lines[64], 'Geometry broke final hidden-source layout');
  root.querySelector('[aria-label="Close record inspector"]').click();
  display('Raw'); await frames(); geometry(); display('Readable'); await frames(); geometry();
  results.push('long/wrapped/expanded/hidden-source rows and representation/resize use real current geometry; mark action preserves reading, inspection and explicit Pause');

  const face = new FontFace('FindMarkProbe', 'url(/Roboto-Regular.ttf)');
  document.fonts.add(face); scroller.style.fontFamily = 'FindMarkProbe, monospace';
  await face.load(); await document.fonts.ready; await frames(); geometry();
  document.fonts.delete(face); scroller.style.fontFamily = ''; await frames(); geometry();
  // Synchronous growth precedes the next observer/frame. A live click must use
  // the new layout at reveal time rather than its prior measured coordinates.
  const last = marks().at(-1);
  rows()[10].style.minHeight = `${longHeight + 2000}px`;
  last.click(); await frames();
  const offset = rows()[120].getBoundingClientRect().top - scroller.getBoundingClientRect().top - scroller.clientTop;
  check(current() === 120 && Math.abs(offset) <= 1, 'Live reveal used stale row geometry');
  rows()[10].style.minHeight = ''; await frames(); geometry();
  results.push('font loading/readiness and presentation growth invalidate geometry; click before queued measurement reveals the current occurrence top-aligned');

  const source = rows()[120].querySelector('.rl-message');
  const range = document.createRange(); range.selectNodeContents(source); document.getSelection().removeAllRanges(); document.getSelection().addRange(range);
  await refresh(lines.join('\n')); await frames();
  check(document.getSelection().toString() === 'needle 120' && rows()[120].querySelector('.rl-message') === source, 'Geometry refresh replaced selected source');
  for (const width of [260, 390, 700, 1440]) {
    root.style.width = `${width}px`; await frames();
    check(root.scrollWidth <= width && document.documentElement.scrollWidth <= innerWidth, `Mark rail overflow at ${width}`);
    check(getComputedStyle(scroller).backgroundColor === 'rgb(0, 0, 0)' && !root.querySelector('.rl-line-number'), 'Marks changed black/no-counter canvas');
    check(marks().every(mark => mark.tagName === 'BUTTON' && mark.type === 'button' && mark.getAttribute('aria-label') && parseFloat(mark.style.top) + 7 <= scroller.clientHeight), 'Marks lack accessible controls or leave track');
    if (globalThis.captureFindMarks) {
      globalThis.findMarksCaptureWidth = width;
      await until(() => !globalThis.findMarksCaptureWidth, 'Marks screenshot not acknowledged');
    }
  }
  document.getSelection().removeAllRanges();
  root.style.width = ''; if (wrap.checked) wrap.click(); await selectLayout('side');
  button('Clear'); root.querySelector('[aria-label="Close Find"]').click(); await frames();
  check(marks().length === 0, 'Cleared marks retained state');
  results.push('retained DOM selection, named native mark buttons, non-color current group, bounded rail and black/no-counter/separate-bar layout at 260/390/700/1440');
}
