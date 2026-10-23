(async () => {
  const p = global.__rl16, { assert, root, click, input, waitConfig, config, requests, button } = p;
  const baseline = requests.length, id = config().profiles[0].id;
  await input('Profile', id);
  root().querySelector('.rl-row').click(); await p.tick();
  await click('Application text');
  const applicationBefore = root().querySelector('[aria-label="Original application text"]').textContent;
  await click('Transport line');
  const transportBefore = root().querySelector('[aria-label="Original transport line"]').textContent;
  await click('Profiles'); await input('Saved profile', id); await click('Edit');
  await input('Message paths', '/items/0/code'); await click('Save profile');
  await waitConfig(c => c.profiles[0].format.messagePaths[0] === '/items/0/code'); await click('Close profiles');
  assert(root().querySelector('.rl-row .rl-message').textContent === 'first', 'Saving the active profile did not reformat');
  assert(root().querySelector('[aria-label="Original transport line"]').textContent === transportBefore, 'Transport original changed');
  await click('Application text');
  assert(root().querySelector('[aria-label="Original application text"]').textContent === applicationBefore, 'Application original changed');
  await click('All fields');
  const complete = root().querySelector('[aria-label="Complete record"]').textContent;
  assert(complete.includes('private') && complete.includes('Nested') && complete.includes('Default message'), 'Full fields lost hidden/extracted content');
  await click('Profiles'); await input('Saved profile', id); await click('Edit');
  await input('Message paths', '/event/text\n/message'); await click('Save profile'); await click('Close profiles');
  assert(root().querySelector('.rl-row .rl-message').textContent === 'Nested α🙂\nmessage', 'Saving restored rules did not reformat');
  assert(requests.length === baseline, 'Active Save/inspection fetched logs');
  assert(button('Resume'), 'Formatting changed Pause');
  return { before: { applicationBefore, transportBefore }, complete, messagesAfterSave: 'first', messagesAfterRestore: root().querySelector('.rl-row .rl-message').textContent,
    requests: requests.slice(baseline), savedConfiguration: config() };
})()
