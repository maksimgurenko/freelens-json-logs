import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shortcutKey } from '../src/renderer/local-shortcuts.ts';

function key(value: string, change: Record<string, unknown> = {}) {
  return { key: value, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false,
    isComposing: false, keyCode: 0, getModifierState: () => false, ...change };
}
test('platform-primary commands reject wrong and additional modifiers', () => {
  for (const mac of [false, true]) {
    const primary = mac ? { metaKey: true } : { ctrlKey: true };
    for (const [value, action] of [['f', 'find'], ['S', 'save'], ['g', 'next'], [mac ? 'ArrowDown' : 'End', 'bottom']]) {
      assert.equal(shortcutKey(key(value, primary), mac), action);
      for (const extra of [{ altKey: true }, { shiftKey: true }, { ctrlKey: true, metaKey: true },
        { isComposing: true }, { keyCode: 229 }, { getModifierState: (name: string) => name === 'AltGraph' }]) {
        assert.equal(shortcutKey(key(value, { ...primary, ...extra }), mac), value === 'g' && 'shiftKey' in extra ? 'previous' : undefined);
      }
      assert.equal(shortcutKey(key(value, mac ? { ctrlKey: true } : { metaKey: true }), mac), undefined);
      assert.equal(shortcutKey(key(value), mac), undefined);
    }
    assert.equal(shortcutKey(key(mac ? 'End' : 'ArrowDown', primary), mac), undefined);
    for (const value of ['[', ']', 'r', 'p', 'F3', 'Pause', 'Enter', 'ArrowLeft']) {
      assert.equal(shortcutKey(key(value, primary), mac), undefined);
    }
  }
});
