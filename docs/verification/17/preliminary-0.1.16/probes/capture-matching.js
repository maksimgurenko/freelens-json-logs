(async () => {
  const h = global.__rl17;
  h.root().querySelector('.rl-matching').scrollIntoView({ block: 'start' }); await h.tick();
  const nodes = [...h.root().querySelectorAll('.rl-matching label, .rl-matching-order li')];
  return { viewport: { width: innerWidth, height: innerHeight }, fields: nodes.map(el => ({ text: el.textContent, rect: el.getBoundingClientRect().toJSON() })),
    horizontalOverflow: h.root().scrollWidth > h.root().clientWidth };
})()
