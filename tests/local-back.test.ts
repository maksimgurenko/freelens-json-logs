import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bindLocalBack } from '../src/renderer/local-back.ts';
import { LocalDismissal } from '../src/renderer/local-dismissal.ts';

// Replay the ownership boundary observed in physical-dirty-01: Chromium moves
// focus from an input to BODY after a Back press on non-focusable panel space.
// These tests exercise the production listener, not native delivery/cancellation.
function fixture() {
  const listeners = new Map<string, Set<(event: any) => void>>();
  const target = (name: string) => ({
    addEventListener(type: string, fn: (event: any) => void) {
      const key = name + type;
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key)!.add(fn);
    },
    removeEventListener(type: string, fn: (event: any) => void) {
      listeners.get(name + type)?.delete(fn);
    },
  });
  const input = {}, panel = {}, foreign = {}, body = {};
  const document = {
    ...target('document'), body, documentElement: {}, activeElement: input,
    hidden: false, hasFocus: () => true, querySelectorAll: () => [],
    defaultView: target('window'),
  };
  const root = {
    ...target('root'), ownerDocument: document, getClientRects: () => [{}],
    contains: (node: unknown) => node === root || node === input || node === panel,
    querySelector: () => null, querySelectorAll: () => [],
  };
  let actions = 0;
  const layers = new LocalDismissal();
  layers.add(1, () => () => actions++);
  const dispose = bindLocalBack(root as unknown as HTMLElement, () => true,
    () => true, layers);
  const send = (type: string, where = panel) => {
    const event = {
      button: 3, target: where, defaultPrevented: false, stopped: false,
      ctrlKey: false, metaKey: false, altKey: false, shiftKey: false,
      preventDefault() { this.defaultPrevented = true; },
      stopImmediatePropagation() { this.stopped = true; },
    };
    for (const owner of type === 'pointerdown' ? ['document', 'root'] : ['root']) {
      for (const fn of listeners.get(owner + type) ?? []) fn(event);
    }
    return event;
  };
  return { document, root, input, panel, foreign, body, send, dispose,
    actions: () => actions,
    blur: () => { for (const fn of listeners.get('windowblur') ?? []) fn({}); },
    listenerCount: () => [...listeners.values()].reduce((n, set) => n + set.size, 0),
  };
}

test('Back remains owned when a press in Profiles panel space moves focus to BODY', () => {
  const f = fixture();
  f.send('pointerdown');
  f.document.activeElement = f.body;
  assert.equal(f.send('mouseup').defaultPrevented, true, 'Release must cancel native Back');
  assert.equal(f.send('auxclick').defaultPrevented, true);
  assert.equal(f.actions(), 1, 'Exactly one local return');
  f.send('auxclick');
  assert.equal(f.actions(), 1, 'Duplicate delivery cannot return again');
  f.dispose();
});

test('Back can begin in Profiles panel space with BODY focus', () => {
  const f = fixture();
  f.document.activeElement = f.body;
  f.send('pointerdown');
  assert.equal(f.send('mouseup').defaultPrevented, true);
  f.send('auxclick');
  assert.equal(f.actions(), 1);
  f.dispose();
});

test('foreign focused controls retain Back ownership at press or release', () => {
  for (const atPress of [false, true]) {
    const f = fixture();
    if (atPress) f.document.activeElement = f.foreign;
    f.send('pointerdown');
    f.document.activeElement = f.foreign;
    assert.equal(f.send('mouseup').defaultPrevented, false);
    assert.equal(f.send('auxclick').defaultPrevented, false);
    assert.equal(f.actions(), 0);
    f.dispose();
  }
});

test('window blur or leaving the root releases a latched Back gesture', () => {
  for (const kind of ['blur', 'leave']) {
    const f = fixture();
    f.send('pointerdown');
    if (kind === 'blur') f.blur(); else f.send('pointerleave');
    assert.equal(f.send('mouseup').defaultPrevented, false);
    f.send('auxclick');
    assert.equal(f.actions(), 0);
    f.dispose();
    assert.equal(f.listenerCount(), 0);
  }
});
