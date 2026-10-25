/** Local layers never create host history. Resolution is separate from execution
 * so a held Escape can be consumed without dismissing another layer. */
export class LocalDismissal {
  private layers = new Map<() => (() => void) | undefined, number>();
  add(priority: number, resolve: () => (() => void) | undefined) {
    this.layers.set(resolve, priority);
    return () => { this.layers.delete(resolve); };
  }
  resolve() {
    for (const [resolve] of [...this.layers].sort((a, b) => b[1] - a[1])) {
      const action = resolve();
      if (action) return action;
    }
  }
}

export function focusLocal(root: HTMLElement, preferred?: HTMLElement | null) {
  const usable = (node?: HTMLElement | null): node is HTMLElement => !!node && root.contains(node) &&
    node.isConnected && !!node.getClientRects().length && !node.closest('[hidden]') && !node.matches(':disabled');
  const fallback = root.querySelector<HTMLElement>('.rl-records');
  if (usable(preferred)) preferred.focus({ preventScroll: true });
  else if (usable(fallback)) fallback.focus({ preventScroll: true });
}

/** Observe, never modify, pinned host transient surfaces. Freelens 1.10.3 Menu
 * closes in window capture without canceling the event. Cache the pre-dispatch
 * DOM state in a MutationObserver: checking only at our root would be too late.
 * The root consumes that same Escape, leaving the earlier menu as its sole action.
 */
export function bindLocalEscape(root: HTMLElement, active: () => boolean, layers: LocalDismissal) {
  const document = root.ownerDocument;
  const visibleOutside = (selector: string) => Array.from(document.querySelectorAll<HTMLElement>(selector))
    .some(node => !root.contains(node) && !!node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden');
  let menu = false, dialog = false, composing = false;
  const observe = () => {
    menu = visibleOutside('.Menu, [role="menu"], [role="listbox"]');
    dialog = visibleOutside('.Dialog, [role="dialog"], [aria-modal="true"]');
  };
  observe();
  const observer = new MutationObserver(observe);
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-expanded'] });
  const compositionStart = () => { composing = true; };
  const compositionEnd = () => { composing = false; };
  const keydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey ||
      !active() || document.hidden || !document.hasFocus() || !root.getClientRects().length ||
      !root.contains(event.target as Node) || !root.contains(document.activeElement) ||
      event.defaultPrevented || event.isComposing || composing || event.keyCode === 229) return;
    // Native popups/IME may consume the key before DOM delivery. If delivered
    // while a popup is open, leave its default cancellation available.
    if (root.querySelector('select:open, input[list]:open') || dialog) return;
    const details = Array.from(root.querySelectorAll<HTMLDetailsElement>('details[open]'))
      .filter(node => !!node.getClientRects().length);
    const disclosure = details.find(node => node.contains(document.activeElement)) ?? details.at(-1);
    const action = menu ? () => {} : disclosure ? () => {
      disclosure.open = false;
      focusLocal(root, disclosure.querySelector('summary'));
    } : layers.resolve();
    if (!action && !event.repeat) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!event.repeat) action?.();
  };
  root.addEventListener('keydown', keydown, true);
  root.addEventListener('compositionstart', compositionStart, true);
  root.addEventListener('compositionend', compositionEnd, true);
  return () => {
    observer.disconnect();
    root.removeEventListener('keydown', keydown, true);
    root.removeEventListener('compositionstart', compositionStart, true);
    root.removeEventListener('compositionend', compositionEnd, true);
  };
}
