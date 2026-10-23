(async () => {
  const h = global.__rl17, { assert, click, input, enabled, ariaClick, root, config, waitConfig, active, message, requests } = h;
  const beforeRequests = requests.length;
  root().querySelector('.rl-row').click(); await h.tick(); await click('Application text');
  const originalApplication = root().querySelector('[aria-label="Original application text"]').textContent;
  await click('Transport line'); const originalTransport = root().querySelector('[aria-label="Original transport line"]').textContent;
  await click('Profiles');
  const create = async (name, field, conditions, matching) => {
    await input('Saved profile', 'default'); await click('Duplicate'); await input('Profile name', name); await input('Message paths', field); await enabled(matching);
    if (conditions.namespace) await input('Match namespace', conditions.namespace);
    if (conditions.container) await input('Match container name', conditions.container);
    for (const [index, [key, value]] of Object.entries(conditions.labels ?? {}).entries()) {
      await click('Add label condition'); await input(`Match label ${index + 1} key`, key); await input(`Match label ${index + 1} value`, value);
    }
    await click('Save profile'); return (await waitConfig(c => c.profiles.some(p => p.name === name))).profiles.find(p => p.name === name).id;
  };
  const first = await create('Ticket17 first', '/first', { namespace: 'readable-logs-ticket-17', container: 'api', labels: { app: 'payments', tier: 'backend' } }, true);
  assert(active() === 'Ticket17 first' && message() === 'First α🙂\napi', 'Exact conjunctive match not applied');
  const second = await create('Ticket17 second', '/second', { container: 'api', labels: { app: 'payments' } }, true);
  assert(active() === 'Ticket17 first', 'First match did not win');
  const fallback = await create('Ticket17 fallback', '/fallback', { namespace: 'readable-logs-ticket-17', container: 'api' }, false);
  await input('Global default', fallback); assert(active() === 'Ticket17 first', 'Global status changed precedence');
  const conditionless = await create('Ticket17 conditionless', '/message', {}, true);
  for (let i = 0; i < 3; i++) await ariaClick('Move Ticket17 conditionless up');
  assert(active() === 'Ticket17 first', 'Conditionless profile auto-matched');
  await input('Profile', fallback); assert(active() === 'Ticket17 fallback' && message() === 'Fallback api', 'Disabled matching prevented manual selection');
  await input('Profile', ''); assert(active() === 'Ticket17 first', 'Auto did not clear manual override');
  await ariaClick('Move Ticket17 second up'); assert(active() === 'Ticket17 second' && message() === 'Second api', 'Saved matching order did not reformat retained record');
  await input('Profile', second); await input('Global default', second); await input('Saved profile', second); await click('Edit');
  await input('Profile name', 'Ticket17 second renamed'); await click('Save profile');
  assert(config().globalDefault === second && root().querySelector('select[aria-label="Profile"]').value === second && active() === 'Ticket17 second renamed', 'Rename lost references');
  const renamedOrder = config().profiles.map(p => p.id);
  assert(renamedOrder.join() === [conditionless, second, first, fallback].join(), 'Rename changed order');
  await click('Edit'); await enabled(false); await click('Save profile');
  assert(active() === 'Ticket17 second renamed', 'Disabling matching invalidated manual selection');
  await input('Profile', ''); assert(active() === 'Ticket17 first', 'Disabled profile still auto-matches');
  await click('Edit'); await input('Match namespace', 'never-saved'); await click('Cancel');
  assert(config().profiles.find(p => p.id === second).matching.conditions.namespace === undefined, 'Canceled matching draft persisted');
  await input('Saved profile', conditionless); await click('Edit'); await click('Add label condition');
  assert([...root().querySelectorAll('[role="alert"]')].some(el => el.textContent.includes('nonempty key')), 'Missing label validation');
  assert(h.button('Save profile').disabled, 'Invalid matching draft can save'); await click('Cancel');
  await input('Global default', fallback);
  await click('Close profiles');
  assert(message() === 'First α🙂\napi', 'Expected active first formatter');
  await click('Application text'); assert(root().querySelector('[aria-label="Original application text"]').textContent === originalApplication, 'Application original changed');
  await click('Transport line'); assert(root().querySelector('[aria-label="Original transport line"]').textContent === originalTransport, 'Transport original changed');
  assert(requests.length === beforeRequests, 'Editor/ordering/selection fetched logs');
  h.ids = { first, second, fallback, conditionless }; h.originals = { originalApplication, originalTransport };
  return { ids: h.ids, configuration: config(), active: active(), message: message(), requests: requests.slice(beforeRequests),
    zeroAdditionalLogRequests: true, originalApplication, originalTransport, renamedOrder,
    assertions: ['exact namespace + two labels + container', 'first match', 'conditionless excluded', 'disabled manual allowed', 'manual to Auto', 'matching order', 'global choice independent of order', 'stable-ID rename', 'disabled matching skipped', 'Cancel discards conditions', 'invalid label blocks Save', 'originals unchanged'] };
})()
