(async () => {
  const p = global.__rl16;
  await p.click('Profiles'); await p.input('Saved profile', p.config().profiles[0].id); await p.click('Edit');
  await p.input('Sample logs', '{"event":{"text":"Preview α🙂\\nmessage","time":1000,"severity":30,"code":"E1","internal":"private"}}');
  const panel = p.root().querySelector('.rl-profile-editor'); panel.scrollTop = 0;
  const rect = panel.getBoundingClientRect();
  return { panel: { width: rect.width, height: rect.height, total: panel.scrollHeight },
    overflow: panel.scrollWidth - panel.clientWidth, hidden: [...p.root().querySelectorAll('[hidden]')].map(el => ({ class: el.className, display: getComputedStyle(el).display, height: el.getBoundingClientRect().height })),
    savedCount: p.config().profiles.length, preview: p.root().querySelector('[aria-label="Profile preview"]').innerText };
})()
