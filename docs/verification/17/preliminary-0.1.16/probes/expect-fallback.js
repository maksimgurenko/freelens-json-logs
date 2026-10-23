(async () => {
  const h = global.__rl17;
  const before = h.requests.length;
  for (let i = 0; i < 100 && h.active() !== 'Ticket17 fallback'; i++) await h.tick();
  h.assert(h.active() === 'Ticket17 fallback' && h.message() === 'Fallback api', 'Observed labels did not select global fallback');
  h.assert(h.requests.length === before && h.button('Resume'), 'Metadata reformatting fetched logs or changed Pause');
  return { active: h.active(), message: h.message(), requests: h.requests.slice(before), text: h.root().innerText,
    observedPod: (await global.LensExtensions.Renderer.K8sApi.podsApi.get({ namespace: 'readable-logs-ticket-17', name: 'profiles' })).metadata,
    unchangedOriginalApplication: h.originals.originalApplication };
})()
