import { focusLocal, type LocalDismissal } from './local-dismissal.ts';

/** The observed Linux mouse path requires mouseup cancellation: canceling
 * auxclick alone still traverses host history. Own only gestures begun in Profiles;
 * resolve one local layer without adding entries or overriding native commands.
 */
export function bindLocalBack(root: HTMLElement, active: () => boolean,
  profiles: () => boolean, layers: LocalDismissal) {
  const document = root.ownerDocument;
  let gesture: { action?: () => void; owned: boolean; handled: boolean } | undefined;
  const outside = (selector: string) => Array.from(document.querySelectorAll<HTMLElement>(selector))
    .some(node => !root.contains(node) && !!node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden');
  const eligible = (event: MouseEvent) => active() && !document.hidden && document.hasFocus() &&
    !!root.getClientRects().length && root.contains(event.target as Node) && root.contains(document.activeElement) &&
    !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey;
  const down = (event: PointerEvent) => {
    if (event.button !== 3) return;
    gesture = undefined;
    if (event.defaultPrevented || !profiles() || !eligible(event) ||
      outside('.Dialog, [role="dialog"], [aria-modal="true"]') || root.querySelector('select:open, input[list]:open')) return;
    // A foreign menu owns its transient interaction. Snapshot its priority at
    // press time so release cannot also return from the underlying Profiles.
    const menu = outside('.Menu, [role="menu"], [role="listbox"]');
    const details = Array.from(root.querySelectorAll<HTMLDetailsElement>('details[open]'))
      .filter(node => !!node.getClientRects().length);
    const disclosure = details.find(node => node.contains(document.activeElement)) ?? details.at(-1);
    const action = menu ? () => {} : disclosure ? () => {
      disclosure.open = false;
      focusLocal(root, disclosure.querySelector('summary'));
    } : layers.resolve();
    gesture = { action, owned: true, handled: false };
  };
  const auxclick = (event: MouseEvent) => {
    if (event.button !== 3 || !gesture?.owned || !eligible(event)) return;
    // Cancel before executing React's synchronous local transition. Keep the
    // consumed token until the next press to swallow duplicate release delivery.
    event.preventDefault();
    event.stopImmediatePropagation();
    if (gesture.handled) return;
    gesture.handled = true;
    if (profiles()) gesture.action?.();
  };
  const up = (event: MouseEvent) => {
    if (event.button !== 3 || !gesture?.owned || !eligible(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  const cancel = () => { gesture = undefined; };
  // A new press outside our root, or leaving it/window focus, ends ownership.
  // These observers never cancel input in another region or cached frame.
  document.addEventListener('pointerdown', cancel, true);
  root.addEventListener('pointerdown', down, true);
  root.addEventListener('auxclick', auxclick, true);
  root.addEventListener('mouseup', up, true);
  root.addEventListener('pointercancel', cancel, true);
  root.addEventListener('pointerleave', cancel);
  document.defaultView?.addEventListener('blur', cancel);
  return () => {
    cancel();
    document.removeEventListener('pointerdown', cancel, true);
    root.removeEventListener('pointerdown', down, true);
    root.removeEventListener('auxclick', auxclick, true);
    root.removeEventListener('mouseup', up, true);
    root.removeEventListener('pointercancel', cancel, true);
    root.removeEventListener('pointerleave', cancel);
    document.defaultView?.removeEventListener('blur', cancel);
  };
}
