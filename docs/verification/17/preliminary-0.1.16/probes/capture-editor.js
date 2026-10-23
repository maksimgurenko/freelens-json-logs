(async () => {
  const h = global.__rl17;
  for (let i = 0; i < 100 && h.message() !== 'Second api'; i++) await h.tick();
  h.assert(h.message() === 'Second api', 'Saved order not applied on primary target');
  if (h.button('Pause')) await h.click('Pause');
  await h.click('Profiles'); await h.input('Saved profile', h.ids.first); await h.click('Edit');
  h.root().querySelector('.rl-profile-editor').scrollTop = 0;
  return { text: h.root().innerText, viewport: { width: innerWidth, height: innerHeight }, configuration: h.config(),
    fields: [...h.root().querySelectorAll('.rl-matching input')].map(el => ({ label: el.getAttribute('aria-label'), value: el.type === 'checkbox' ? el.checked : el.value })) };
})()
