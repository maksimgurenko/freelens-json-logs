import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LogViewport } from '../src/renderer/log-viewport.ts';
import { parseTransportLine } from '../src/core/records.ts';

class Scroller extends EventTarget {
  scrollTop = 0; scrollLeft = 0; clientHeight = 100; clientTop = 0;
  count = 200;
  get scrollHeight() { return this.count * 20; }
  getBoundingClientRect() { return { top: 0 }; }
  querySelector(selector: string) { return this.row(Number(/"(\d+)"/.exec(selector)?.[1])); }
  querySelectorAll() { return Array.from({ length: this.count }, (_, i) => this.row(i)); }
  row(index: number) {
    if (index < 0 || index >= this.count || !Number.isInteger(index)) return undefined;
    return { dataset: { recordIndex: String(index) }, getBoundingClientRect: () => ({ top: index * 20 - this.scrollTop, bottom: (index + 1) * 20 - this.scrollTop }) };
  }
}

function scenario(run: (element: Scroller, viewer: LogViewport, replace: (lines: string[]) => void, status: () => { following: boolean; lost: boolean }) => void) {
  const original = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  const element = new Scroller();
  let records = Array.from({ length: 200 }, (_, i) => parseTransportLine(`record ${i}`));
  let status = { following: true, lost: false };
  // Reproduce React 17's synchronous render from a native event callback.
  const viewer = new LogViewport(element as unknown as HTMLElement, value => { status = value; viewer.update(records); });
  const replace = (lines: string[]) => { records = lines.map(parseTransportLine); element.count = records.length; viewer.update(records); };
  try { viewer.update(records); run(element, viewer, replace, () => status); }
  finally { viewer.dispose(); globalThis.ResizeObserver = original; }
}

test('a synchronous render during scroll-status publication preserves the newly captured pixel anchor', () => {
  scenario((element, viewer, replace, status) => {
    assert.equal(element.scrollTop, 4000); // Browser clamps to bottom; fake geometry does not.
    element.scrollTop = 507;
    element.dispatchEvent(new Event('scroll'));
    assert.deepEqual(status(), { following: false, lost: false });
    assert.equal(element.scrollTop, 507);
    replace(Array.from({ length: 200 }, (_, i) => `record ${i + 10}`));
    assert.equal(element.scrollTop, 307);
    viewer.show(40);
    assert.equal(element.scrollTop, 800);
    viewer.toBottom();
    assert.equal(status().following, true);
  });
});

test('lost anchor remains visible across programmatic scroll events until To bottom acknowledges it', () => {
  scenario((element, viewer, replace, status) => {
    element.scrollTop = 407;
    element.dispatchEvent(new Event('scroll'));
    replace(Array.from({ length: 200 }, (_, i) => `different ${i}`));
    assert.deepEqual(status(), { following: false, lost: true });
    element.dispatchEvent(new Event('scroll'));
    assert.equal(status().lost, true);
    viewer.toBottom();
    assert.deepEqual(status(), { following: true, lost: false });
  });
});

test('bottom following and repeated-record anchors survive appended and bounded replacement windows', () => {
  scenario((element, _viewer, replace, status) => {
    const lines = Array.from({ length: 200 }, (_, i) => i === 25 || i === 26 ? 'repeat' : `record ${i}`);
    replace(lines);
    assert.equal(status().following, true);
    element.scrollTop = 527;
    element.dispatchEvent(new Event('scroll'));
    replace([...lines.slice(10), 'new']);
    assert.equal(element.scrollTop, 327);
    assert.equal(status().lost, false);
    replace(['repeat', ...lines.slice(27), 'new']);
    assert.equal(element.scrollTop, 7);
    assert.equal(status().lost, false);
  });
});
