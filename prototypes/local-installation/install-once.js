// PROTOTYPE: invoke the observed Install control exactly once.
(async () => {
  const input = document.querySelector('input[placeholder="Name or file path or URL"]');
  if (!input) throw new Error('Expected Extensions installation input');
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input,
    '/tmp/freelens-local-installation-worktree/prototypes/host-integration/freelens-readable-logs-host-spike-0.0.1.tgz');
  input.dispatchEvent(new Event('input', {bubbles: true}));
  await new Promise(resolve => setTimeout(resolve, 150));
  const button = [...document.querySelectorAll('button')].find(e => e.textContent === 'Install');
  if (!button || button.disabled) throw new Error('Install control unavailable');
  button.click();
  return {clickCount: 1, input: input.value, at: new Date().toISOString()};
})()
