// Cross-feature behavior on one mounted production viewer. The caller supplies
// DOM/SDK boundary helpers, never private controller state.
export async function verifyFindIntegration({ root, rows, button, query, refresh, until, check, turn, results, failRanges, selectText, copies }) {
  root.querySelector('[aria-label="Close record inspector"]')?.click();
  button('Find');
  root.querySelector('.rl-display-options').open = true; button('Readable'); root.querySelector('.rl-display-options').open = false;
  for (const mode of ['Match case', 'Whole words']) {
    const control = root.querySelector(`[aria-label="${mode}"]`);
    if (control.getAttribute('aria-pressed') === 'true') control.click();
  }
  const original = JSON.stringify({ message: 'visible', hidden: 'needle '.repeat(500), padding: 'x'.repeat(1650) });
  await refresh(Array(1000).fill(original).join('\n'));
  await query('needle');
  const marks = () => [...root.querySelectorAll('.rl-find-mark')];
  const population = () => marks().reduce((sum, mark) => sum + Number(/Find (\d+) matching records/.exec(mark.getAttribute('aria-label'))?.[1] ?? 1), 0);
  await until(() => population() === 1000, 'Combined hidden-source marks lost exact records');
  root.querySelector('[aria-label="Match in original text"]').click(); await turn();
  const source = () => root.querySelector('.rl-detail pre');
  check(source().textContent === original, 'Hidden source is not exact application text');
  await until(() => root.querySelector('.rl-highlight-status')?.getAttribute('aria-busy') !== 'true', 'Hidden inspector decoration did not settle');
  button('Clear'); root.querySelector('[aria-label="Close Find"]').click();
  const offset = original.indexOf('needle'); selectText(source(), offset, offset + 6);
  button('Find'); await until(() => root.querySelector('.rl-find-count').textContent.endsWith('of 1000 matching records'), 'Hidden-source selection did not seed complete matching');
  check(root.querySelector('#rl-find').value === 'needle', 'Selected hidden text was not seeded');
  await until(() => population() === 1000, 'Seeded query lost mark population');
  const first = marks()[0]; first.click(); await turn();
  check(root.querySelector('.rl-find-count').textContent === '1 of 1000 matching records', 'Mark ordinal disagrees with seeded count');
  check(root.querySelector('.rl-detail pre').textContent === original, 'Mark changed independent hidden-source inspection');
  // A failed decoration still permits exact navigation and history commitment.
  failRanges(); await query('need');
  await until(() => root.querySelector('.rl-highlight-status')?.textContent.includes('Retry highlights'), 'Combined decoration failure missing');
  await until(() => population() === 1000, 'Failure capped complete mark membership');
  marks()[0].click(); await turn();
  check(root.querySelector('.rl-find-count').textContent.endsWith('of 1000 matching records'), 'Decoration failure changed navigation ordinal');
  root.querySelector('[aria-label="Search history"]').click(); await turn();
  check(root.querySelector('.rl-history-text')?.textContent === 'need', 'Decoration failure blocked explicit mark history');
  root.querySelector('[aria-label="Close search history"]').click();
  selectText(source()); check(document.getSelection().toString() === original, 'Combined full-source selection includes generated labels or loses source');
  button('Copy application text'); button('Copy transport line'); await turn();
  check(copies.at(-1) === original && copies.at(-2) === original, 'Combined original copy payloads changed');
  check([...CSS.highlights].reduce((sum, [, highlight]) => sum + highlight.size, 0) <= 1024, 'Combined shared DOM range cap exceeded');
  results.push('D07/D08/D10/D12/D13/D16 integration: hidden-source selection seeds 1000 exact records; failed decoration preserves mark population, ordinal and history; exact full-source selection/copy payloads');
  document.getSelection().removeAllRanges();
  root.querySelector('[aria-label="Close record inspector"]').click(); button('Clear');
  root.querySelector('[aria-label="Close Find"]').click();
}
