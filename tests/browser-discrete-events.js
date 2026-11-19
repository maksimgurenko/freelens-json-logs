import { flushSync } from 'react-dom';

// Synthetic input can run back-to-back in one fixture task. Commit discrete
// actions individually, as when the browser delivers them separately.
export function commitDiscreteEvents() {
  const nativeClick = HTMLElement.prototype.click;
  HTMLElement.prototype.click = function () { flushSync(() => nativeClick.call(this)); };
  const nativeDispatch = HTMLElement.prototype.dispatchEvent;
  HTMLElement.prototype.dispatchEvent = function (event) { return flushSync(() => nativeDispatch.call(this, event)); };
}
