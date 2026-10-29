// Behavioral checks on the mounted production renderer, real DOM Ranges and
// main-owned built worker. No physical input or system clipboard is exercised.
export async function verifyFindPresentation({ root, rows, button, query, refresh, until, check, turn, results, rangeRequests, failRanges }) {
  const scroller = root.querySelector('.rl-records');
  const ranges = () => [...CSS.highlights].flatMap(([, highlight]) => [...highlight]);
  const decorated = () => !root.querySelector('.rl-highlight-status')?.textContent.includes('pending');
  const wait = () => until(decorated, 'Decoration did not settle');
  const closeInspector = () => root.querySelector('[aria-label="Close record inspector"]')?.click();
  const display = name => { root.querySelector('.rl-display-options').open = true; button(name); root.querySelector('.rl-display-options').open = false; };
  const select = element => { const range = document.createRange(); range.selectNodeContents(element);
    document.getSelection().removeAllRanges(); document.getSelection().addRange(range); return range; };
  // The two checkboxes live in separate labels; address the control by its label.
  const wrapControl = [...root.querySelectorAll('.rl-display-panel label')].find(label => label.textContent.includes('Word wrap')).querySelector('input');

  closeInspector();
  button('Find'); await refresh('needle needle\nneedle elsewhere\nplain'); await query('needle'); await wait();
  check(ranges().length === 3 && ranges().every(range => range.toString() === 'needle'), 'Visible text matches are not native source ranges');
  const source = rows()[0].querySelector('[data-find-source]'), textNode = source.querySelector('[data-source-start]').firstChild;
  const row = rows()[0].querySelector('.rl-row'); row.focus({ preventScroll: true }); select(source);
  if (row.matches(':focus-visible')) check(getComputedStyle(row).outlineStyle === 'dashed' && getComputedStyle(row).outlineWidth === '2px', 'Current Find outline hid the keyboard focus treatment');
  else results.push('focus-visible pseudo-state is inactive in the unfocused headless document; physical focus styling remains unverified');
  await query('need'); await wait();
  check(document.getSelection().toString() === 'needle needle' && source.querySelector('[data-source-start]').firstChild === textNode, 'Query decoration replaced selected source text');
  check(document.activeElement === row, 'Highlight update stole DOM focus');
  await refresh('needle needle\nneedle elsewhere\nplain'); await wait();
  check(rows()[0].querySelector('[data-find-source]') === source && document.getSelection().toString() === 'needle needle', 'Unchanged snapshot replaced selected source');
  const other = rows()[1].querySelector('.rl-row');
  check(getComputedStyle(other).backgroundColor === 'rgba(0, 0, 0, 0)', 'Every matching row was shaded');
  results.push('D07/D13: native Custom Highlights, exact visible spans, distinct current result; real selection/text nodes/focus survive query and identical snapshot');

  document.getSelection().removeAllRanges();
  failRanges(); await query('needle'); await until(() => root.querySelector('.rl-highlight-status')?.textContent.includes('Retry highlights'), 'Missing decoration failure feedback');
  check(root.querySelector('.rl-find-count').textContent === '1 of 2 matching records' && !root.querySelector('[aria-label="Next match"]').disabled, 'Decoration failure invalidated exact matches/navigation');
  const before = rangeRequests.length;
  await refresh('needle needle\nneedle elsewhere\nplain'); await turn();
  check(rangeRequests.length === before, 'Snapshot maintenance retried failed decoration');
  button('Retry highlights'); await wait(); check(ranges().length === 3, 'Explicit decoration recovery failed');
  results.push('decoration failure keeps exact count/ordinal/navigation; refresh does not retry, explicit Retry highlights recovers');

  // Real retention, including the record count boundary and a dense visible
  // window whose exact record list is independent of the DOM decoration cap.
  for (const count of [999, 1000, 1001]) {
    await refresh(Array.from({ length: count }, (_, index) => `a ${index} ${'a '.repeat(120)}`).join('\n'));
    await query('a'); scroller.scrollTop = 0; await wait();
    await until(() => ranges().some(range => rows()[0].contains(range.startContainer)), 'Dense window top has no current visible ranges');
    check(rows().length === Math.min(count, 1000), 'Production retention line bound changed');
    check(root.querySelector('.rl-find-count').textContent.endsWith(`of ${Math.min(count, 1000)} matching records`), 'Decoration capped exact count');
    check(ranges().length <= 1024, 'Shared DOM highlight cap exceeded');
    check(root.querySelector('.rl-highlight-status')?.textContent.includes('incomplete'), 'Dense coverage was silently reported complete');
    const oldInterest = rangeRequests.length;
    scroller.scrollTop = scroller.scrollHeight;
    await until(() => rangeRequests.length > oldInterest && ranges().some(range => rows().at(-1).contains(range.startContainer)), 'Late visible record did not request its ranges').catch(error => {
      throw new Error(`${error.message}: ${JSON.stringify({ count, oldInterest, interests: rangeRequests.length,
        last: rangeRequests.at(-1).rangeInterest.scopes, status: root.querySelector('.rl-highlight-status')?.textContent,
        scroll: [scroller.scrollTop, scroller.scrollHeight, scroller.clientHeight], lastRow: rows().at(-1).getBoundingClientRect().toJSON(),
        native: ranges().slice(-4).map(range => ({ text: range.toString(), record: range.startContainer.parentElement.closest('.rl-record')?.dataset.recordIndex })) })}`);
    });
  }
  results.push('actual 999/1000/1001-line retention; dense exact counts survive 1024 DOM cap; late visible records receive current ranges');
  // A capped query must settle without its own feedback repeatedly changing
  // the visible interest. The dense source crosses the DOM cap at this clip.
  const viewer = root.querySelector('.readable-logs');
  const oldSize = { width: viewer.style.width, height: viewer.style.height };
  viewer.style.width = '1163px'; viewer.style.height = '617px';
  if (!wrapControl.checked) wrapControl.click();
  button('Clear');
  await refresh(Array.from({ length: 1000 }, () => `2026-10-22T12:34:56Z ${'a '.repeat(2400)}`).join('\n'));
  scroller.scrollTop = 8;
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  // Place match 1025 just inside the no-feedback clip. A newly inserted status
  // line hides it, dropping visible ranges under the cap and removing itself.
  const boundary = document.createRange();
  const denseText = rows()[0].querySelector('[data-source-start]').firstChild;
  boundary.setStart(denseText, 2048); boundary.setEnd(denseText, 2049);
  viewer.style.height = `${viewer.clientHeight + boundary.getBoundingClientRect().top - scroller.getBoundingClientRect().bottom + 5}px`;
  await query('a'); scroller.scrollTop = 8;
  await until(() => ranges().length > 0 && decorated(), 'Dense wrapped decoration did not settle');
  for (let frame = 0; frame < 6; frame++) await new Promise(resolve => requestAnimationFrame(resolve));
  const feedbackHeights = [];
  for (let frame = 0; frame < 12; frame++) {
    await new Promise(resolve => requestAnimationFrame(resolve));
    feedbackHeights.push(scroller.clientHeight);
  }
  check(new Set(feedbackHeights).size === 1, `Dense feedback resized its own clip repeatedly: ${feedbackHeights}`);
  check(root.querySelector('.rl-find-count').textContent.endsWith('of 1000 matching records') && ranges().length > 0 && ranges().length <= 1024,
    'Stable feedback lost exact membership or visible bounded highlights');
  viewer.style.width = '260px'; viewer.style.height = '617px';
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  check(scroller.clientHeight > 0 && viewer.scrollWidth <= 260, 'Reserved feedback displaced the narrow log viewport');
  viewer.style.width = oldSize.width; viewer.style.height = oldSize.height;
  if (wrapControl.checked) wrapControl.click();
  results.push('capped wrapped decoration settles with stable feedback geometry and complete exact membership');
  // Restore the preceding fixture and bottom reading position for its separate
  // viewport/inspector sharing check below.
  await refresh(Array.from({ length: 1001 }, (_, index) => `a ${index} ${'a '.repeat(120)}`).join('\n'));
  scroller.scrollTop = scroller.scrollHeight;
  await until(() => ranges().some(range => rows().at(-1).contains(range.startContainer)), 'Restored dense fixture has no visible ranges');

  rows().at(-1).querySelector('.rl-row').click(); button('Application text');
  await until(() => ranges().some(range => root.querySelector('.rl-detail pre').contains(range.startContainer)) &&
    ranges().some(range => range.startContainer.parentElement.closest('.rl-row')), 'Viewport and inspector did not share decoration slots');
  check(ranges().length <= 1024, 'Viewport and inspector each allocated their own 1024 DOM ranges');
  check(root.querySelector('.rl-find-count').textContent.endsWith('of 1000 matching records'), 'Inspector decoration changed exact membership');
  closeInspector();
  results.push('viewport and inspector distribute one shared 1024 DOM range budget while preserving all 1000 exact matching records');

  if (!wrapControl.checked) wrapControl.click();
  const unicode = 'x'.repeat(8190) + 'a😀banana';
  await refresh(unicode); await query('a😀b'); scroller.scrollTop = scroller.scrollHeight; await wait();
  await until(() => ranges().some(range => range.toString() === 'a😀b'), 'Fragment-spanning Unicode match missing');
  const crossing = ranges().find(range => range.toString() === 'a😀b');
  check(crossing.startContainer !== crossing.endContainer, 'Fixture did not exercise cross-fragment source mapping');
  const fragments = [...rows()[0].querySelectorAll('[data-source-start]')];
  check(fragments[0].textContent.length === 8191 && fragments[1].textContent.startsWith('😀'), 'Fragment boundary split surrogate pair');
  await query('ana'); scroller.scrollTop = scroller.scrollHeight; await wait();
  await until(() => ranges().some(range => range.toString() === 'ana'), 'Whole-source occurrence not mapped');
  check(ranges().length === 1 && ranges()[0].startOffset === 3, 'Fragment interest restarted overlapping enumeration');
  select(rows()[0].querySelector('.rl-message'));
  check(document.getSelection().toString() === unicode, 'Fragments inserted synthetic selection separators');
  document.getSelection().removeAllRanges();
  results.push('astral fragment boundary and cross-node original offsets; whole-source non-overlap; full-source DOM selection without inserted line breaks');

  // Exactly one 5 MiB retained source, with its hit at the far end. It is fully
  // mounted, rather than truncated or paginated to satisfy the highlight limit.
  const budget = 5 * 1024 * 1024;
  for (const bytes of [budget - 1, budget, budget + 1]) {
    const long = 'x'.repeat(bytes - 2) + ' Q';
    await refresh(long); await query('Q');
    if (bytes > budget) { check(rows().length === 0 && root.textContent.includes('exceeds the 5 MiB'), 'Oversized source retained'); continue; }
    check(rows().length === 1 && rows()[0].querySelector('.rl-message').textContent === long, 'Complete long source was truncated');
    check([...rows()[0].querySelectorAll('[data-source-start]')].every(node => node.textContent.length <= 8192), 'Long source fragment exceeds 8192 units');
    scroller.scrollTop = scroller.scrollHeight;
    // Current-key covering ranges can already have been requested while the
    // viewport was following. Reusing them must not require another dispatch.
    await until(() => ranges().some(range => range.toString() === 'Q'), 'Late visible 5 MiB source hit unavailable');
    check(rangeRequests.at(-1).rangeInterest.scopes.some(scope => scope.start > budget - 20000), 'Late-source interest used an initial global sample');
    select(rows()[0].querySelector('.rl-message'));
    check(document.getSelection().toString() === long, 'Full 5 MiB source selection changed text');
    document.getSelection().removeAllRanges();
  }
  results.push('actual at/under/over 5 MiB retention, complete single-source DOM/selection, bounded fragments and late-source visible range requests');

  // Status/toolbar changes can resize a clipping scroller without resizing the
  // viewer or its source text, and without generating a scroll event.
  const work = root.querySelector('.rl-work');
  work.style.maxHeight = '120px';
  await refresh(JSON.stringify({ message: `${'ordinary\n'.repeat(16)}middle Q\n${'ordinary\n'.repeat(64)}` }));
  await query('Q'); await wait(); scroller.scrollTop = 0; await turn();
  await until(() => !ranges().some(range => range.toString() === 'Q'), 'Clipping fixture did not hide Q');
  const clippedSource = rows()[0].querySelector('.rl-message');
  const sourceHeight = clippedSource.getBoundingClientRect().height, rootHeight = root.clientHeight;
  const oldClipHeight = scroller.clientHeight, oldScrollTop = scroller.scrollTop;
  work.style.maxHeight = '';
  await until(() => scroller.clientHeight > oldClipHeight, 'Clipping scroller did not grow');
  check(clippedSource.getBoundingClientRect().height === sourceHeight && root.clientHeight === rootHeight && scroller.scrollTop === oldScrollTop,
    `Clipping fixture changed source/root geometry or scroll: ${JSON.stringify({sourceHeight,nowSource:clippedSource.getBoundingClientRect().height,rootHeight,nowRoot:root.clientHeight,oldScrollTop,nowTop:scroller.scrollTop,oldClipHeight,nowClip:scroller.clientHeight})}`);
  await until(() => ranges().some(range => range.toString() === 'Q'), 'Newly visible hit after clipping-scroller resize is undecorated');
  results.push('clipping-scroller resize requests newly visible ranges while source/root dimensions and scroll remain unchanged');

  await refresh('{"message":"x","other":"\\u03a3","value":"needle"}');
  rows()[0].querySelector('.rl-row').click(); button('All fields');
  button('Clear'); root.querySelector('[aria-label="Close Find"]').click();
  const selectPretty = (text, length = text.length) => {
    const pretty = root.querySelector('.rl-detail pre');
    const start = pretty.textContent.indexOf(text);
    const point = offset => {
      const fragments = [...pretty.querySelectorAll('[data-source-start]')];
      const fragment = fragments.find(node => Number(node.dataset.sourceStart) + node.textContent.length >= offset);
      return [fragment.firstChild, offset - Number(fragment.dataset.sourceStart)];
    };
    const range = document.createRange(); range.setStart(...point(start)); range.setEnd(...point(start + length));
    document.getSelection().removeAllRanges(); document.getSelection().addRange(range);
  };
  for (const text of ['  ', 'Σ']) {
    selectPretty(text); button('Find'); await turn();
    check(root.querySelector('#rl-find').value === '', 'Transformed All fields selection lacked source provenance');
    root.querySelector('[aria-label="Close Find"]').click();
  }
  selectPretty('needle'); button('Find'); await until(() => root.querySelector('.rl-find-count').textContent === '1 of 1 matching records', 'Verified original field-value selection stopped seeding');
  closeInspector();
  for (const [application, text] of [['{"message":"\\u03a3"}', 'Σ'], ['{"other":"\\u03a3 needle"}', 'needle']]) {
    await refresh(application); rows()[0].querySelector('.rl-row').click(); button('All fields');
    button('Clear'); root.querySelector('[aria-label="Close Find"]').click(); selectPretty(text); button('Find');
    await until(() => root.querySelector('.rl-find-count').textContent === '1 of 1 matching records', 'Actual extracted/original slice was rejected in All fields');
    check(root.querySelector('#rl-find').value === text, 'All fields did not seed its verified source slice'); closeInspector();
  }
  const emptyOther = JSON.stringify({ message: 'x', other: '' }, null, 2);
  const padding = 'z'.repeat(8191 - emptyOther.indexOf('""') - 1);
  await refresh(`{"message":"x","other":"${padding}a\\u0062 c b"}`);
  rows()[0].querySelector('.rl-row').click(); button('All fields');
  button('Clear'); root.querySelector('[aria-label="Close Find"]').click(); selectPretty('ab'); button('Find'); await turn();
  check(root.querySelector('#rl-find').value === '', 'Fragment-wise validation concatenated pieces without a source counterpart');
  closeInspector();
  results.push('D12: generated indentation and decoded non-message values rejected; original slices in escaped tokens and exact active extracted source still seed from All fields');

  await refresh('{"message":"visible message","secret":"needle"}'); await query('needle'); await wait();
  for (const width of [260, 390, 700, 1440]) {
    root.style.width = `${width}px`; await turn(); await wait();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const hint = root.querySelector('.rl-match-hint'), message = root.querySelector('.rl-message');
    check(hint && getComputedStyle(hint).textDecorationLine.includes('underline'), 'Hidden source action is not underlined');
    check(document.documentElement.scrollWidth <= Math.max(innerWidth, width), 'Narrow layout caused page overflow');
    const range = select(rows()[0].querySelector('.rl-row'));
    check(!range.toString().includes('Match in original text'), 'Generated hint entered selected log text');
    document.getSelection().removeAllRanges();
    if (width === 260) check(hint.getBoundingClientRect().top > message.getBoundingClientRect().top, 'Narrow hint did not wrap below');
    else check(Math.abs(hint.getBoundingClientRect().top - message.getBoundingClientRect().top) < 5, 'Wide hint not beside message');
    if (globalThis.captureFindPresentation) {
      globalThis.findPresentationCaptureWidth = width;
      await until(() => globalThis.findPresentationCaptureWidth === 0, 'Capture runner did not capture presentation');
    }
  }
  root.style.width = '';
  check(getComputedStyle(scroller).backgroundColor === 'rgb(0, 0, 0)' && !root.querySelector('.rl-line-number'), 'Black/no-counter appearance changed');
  check(root.querySelector('.rl-toolbar') !== root.querySelector('.rl-findbar'), 'Toolbar and Find bar combined');
  check(root.querySelector('.rl-update-status').textContent === 'Paused', 'Decoration changed Pause');
  results.push('D08/D12: hint beside message or wrapped below, underlined, excluded from source selection; 260/390/700/1440 px; black canvas, no counters, separate bar and Pause');
  if (wrapControl.checked) wrapControl.click();
  display('Readable'); closeInspector(); button('Clear'); root.querySelector('[aria-label="Close Find"]').click();
}
