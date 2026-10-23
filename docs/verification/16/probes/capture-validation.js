(async () => {
  const p = global.__rl16;
  await p.input('Message paths', 'invalid/path');
  const panel = p.root().querySelector('.rl-profile-editor'); panel.scrollTop = panel.scrollHeight;
  return { saveDisabled: p.button('Save profile').disabled, alert: panel.querySelector('[role="alert"]').innerText,
    top: panel.scrollTop, height: panel.clientHeight, total: panel.scrollHeight };
})()
