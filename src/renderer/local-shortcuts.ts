export type Shortcut = 'find' | 'next' | 'previous' | 'save' | 'bottom';
type Key = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'isComposing' | 'keyCode' | 'getModifierState'>;

/** Semantic keys, with the platform's actual primary modifier. */
export function shortcutKey(event: Key, mac: boolean): Shortcut | undefined {
  if (event.isComposing || event.keyCode === 229 || event.getModifierState('AltGraph') || event.altKey) return;
  const primary = mac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
  if (!primary) return;
  const key = event.key.toLowerCase();
  if (key === 'g') return event.shiftKey ? 'previous' : 'next';
  if (event.shiftKey) return;
  if (key === 'f') return 'find';
  if (key === 's') return 'save';
  if (key === (mac ? 'arrowdown' : 'end')) return 'bottom';
}

export const isMac = () => navigator.platform.startsWith('Mac');
export const shortcutHint = (key: string) => `${isMac() ? 'Cmd' : 'Ctrl'}+${key}`;

/** Register at extension activation, before native Logs mounts its selection
 * capture listener. Each mounted viewer supplies its own guarded resolver;
 * without an eligible viewer this does nothing. Never rewrite native search or
 * selection after its handler has run. The extension owns this listener's lifetime.
 */
export class ShortcutCapture {
  private handlers = new Set<(event: KeyboardEvent) => void>();
  add(handler: (event: KeyboardEvent) => void) {
    this.handlers.add(handler);
    return () => { this.handlers.delete(handler); };
  }
  bind(window: Window) {
    const keydown = (event: KeyboardEvent) => { for (const handler of this.handlers) handler(event); };
    window.addEventListener('keydown', keydown, true);
    return () => { window.removeEventListener('keydown', keydown, true); this.handlers.clear(); };
  }
}

export class LocalShortcuts {
  private handlers = new Map<Shortcut, (target: Element) => (() => void) | undefined>();
  add(command: Shortcut, resolve: (target: Element) => (() => void) | undefined) {
    this.handlers.set(command, resolve);
    return () => { if (this.handlers.get(command) === resolve) this.handlers.delete(command); };
  }
  resolve(command: Shortcut, target: Element) { return this.handlers.get(command)?.(target); }
}

export function editable(target: Element) {
  return !!target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], .monaco-editor, .CodeMirror');
}

/** Only cancel an owned command, before the host's window-bubble Find handler.
 * Observe foreign transients without changing their DOM or input ownership.
 */
export function bindLocalShortcuts(root: HTMLElement, active: () => boolean, commands: LocalShortcuts, capture: ShortcutCapture) {
  const document = root.ownerDocument;
  let composing = false, foreign = false, savedKeyHeld = false;
  const observe = () => { foreign = Array.from(document.querySelectorAll<HTMLElement>('.Menu, [role="menu"], [role="listbox"], .Dialog, [role="dialog"], [aria-modal="true"]'))
    .some(node => !root.contains(node) && !!node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden'); };
  observe();
  const observer = new MutationObserver(observe);
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  const start = () => { composing = true; };
  const end = () => { composing = false; };
  const release = (event: KeyboardEvent) => { if (event.key.toLowerCase() === 's') savedKeyHeld = false; };
  const blur = () => { savedKeyHeld = false; composing = false; };
  const keydown = (event: KeyboardEvent) => {
    if (!active() || document.hidden || !document.hasFocus() || !root.getClientRects().length ||
      !root.contains(event.target as Node) || !root.contains(document.activeElement) ||
      event.defaultPrevented || composing || foreign ||
      root.querySelector('select:open, input[list]:open, details[open], [data-local-confirmation], .rl-shortcuts')) return;
    const target = event.target as Element;
    const command = shortcutKey(event, isMac());
    // Find Enter belongs only to this input; no modifiers except Shift.
    const enter = event.key === 'Enter' && target.matches('#rl-find') && !event.ctrlKey && !event.metaKey && !event.altKey &&
      !event.isComposing && event.keyCode !== 229 && !event.getModifierState('AltGraph');
    const action = command ? commands.resolve(command, target) : enter ? commands.resolve(event.shiftKey ? 'previous' : 'next', target) : undefined;
    const heldSave = command === 'save' && event.repeat && savedKeyHeld;
    if (!action && !heldSave) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (command === 'save') {
      savedKeyHeld = true;
      if (event.repeat) return;
    }
    action?.();
  };
  const stopCapture = capture.add(keydown);
  root.addEventListener('compositionstart', start, true);
  root.addEventListener('compositionend', end, true);
  document.defaultView?.addEventListener('keyup', release, true);
  document.defaultView?.addEventListener('blur', blur);
  return () => {
    observer.disconnect();
    stopCapture();
    root.removeEventListener('compositionstart', start, true);
    root.removeEventListener('compositionend', end, true);
    document.defaultView?.removeEventListener('keyup', release, true);
    document.defaultView?.removeEventListener('blur', blur);
  };
}
