/** Page visibility covers Electron hide/minimize. Intersection covers a cached
 * cluster iframe hidden by the host. Keyboard focus is deliberately irrelevant. */
export function bindVisibility(element: HTMLElement, active: (value: boolean) => void) {
  let displayed = element.getClientRects().length > 0;
  const update = () => active(!element.ownerDocument.hidden && displayed);
  const observer = new IntersectionObserver(entries => {
    displayed = entries.some(entry => entry.isIntersecting);
    update();
  });
  element.ownerDocument.addEventListener('visibilitychange', update);
  observer.observe(element);
  update();
  return () => {
    observer.disconnect();
    element.ownerDocument.removeEventListener('visibilitychange', update);
  };
}
