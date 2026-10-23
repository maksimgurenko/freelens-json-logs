(async () => {
  const p = global.__rl16, { assert, tick, root, input, button, click, config } = p;
  const id = config().profiles[1].id;
  await input('Profile', id); await input('Container', 'plain');
  for (let i = 0; i < 100 && (root().querySelectorAll('.rl-row').length !== 1 || button('Refresh').disabled); i++) await tick();
  assert(root().querySelector('[aria-label="Profile"]').value === '', 'Container change retained manual choice');
  assert(root().querySelector('.rl-row .rl-message').textContent === 'Other container', 'Wrong real container logs');
  const plain = { choice: root().querySelector('[aria-label="Profile"]').value, automatic: !!button('Pause'), message: root().querySelector('.rl-row .rl-message').textContent };
  await click('Pause'); await input('Container', 'json');
  for (let i = 0; i < 100 && (root().querySelectorAll('.rl-row').length !== 2 || button('Refresh').disabled); i++) await tick();
  assert(root().querySelector('[aria-label="Profile"]').value === '', 'New container retained manual choice');
  assert(root().querySelector('.rl-row .rl-message').textContent === 'Nested α🙂\nmessage', 'Auto failed to apply global default');
  await click('Pause');
  await input('Profile', id);
  const requests = p.requests.slice();
  // Restore transport observation before leaving this renderer for the closed-view check.
  p.restore();
  global.LensExtensions.Renderer.Navigation.navigate('/pods'); await tick();
  return { plain, returningToJSON: { choice: '', active: 'Ticket 16 renamed', paused: true }, requests, departedWithManual: id };
})()
