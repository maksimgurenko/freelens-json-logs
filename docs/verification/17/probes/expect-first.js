(async () => {
  const h = global.__rl17, before = h.requests.length;
  for (let i = 0; i < 100 && h.active() !== 'Ticket17 first'; i++) await h.tick();
  h.assert(h.active() === 'Ticket17 first' && h.message() === 'First α🙂\napi', 'Valid labels did not restore first match');
  h.assert(h.requests.length === before && h.button('Resume'), 'Label reformatting fetched logs or changed Pause');
  return { active: h.active(), message: h.message(), requests: h.requests.slice(before) };
})()
