(() => {
  const pause = document.querySelector('[data-spike="pause"]');
  if (pause.textContent === 'Pause') pause.click();
  const input = document.querySelector('[data-spike="marker"]');
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'installation-upgrade-proof-2026-10-22');
  input.dispatchEvent(new Event('input', {bubbles:true}));
  return {value:input.value, at:new Date().toISOString()};
})()
