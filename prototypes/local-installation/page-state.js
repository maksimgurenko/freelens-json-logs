({at:new Date().toISOString(), heading:document.querySelector('h2')?.textContent,
  target:document.querySelector('[data-spike="target"]')?.textContent,
  marker:document.querySelector('[data-spike="marker"]')?.value,
  phase:document.querySelector('[data-spike="phase"]')?.textContent,
  facts:document.querySelector('[data-spike="facts"]')?.textContent,
  raw:document.querySelector('[data-spike="raw"]')?.textContent})
