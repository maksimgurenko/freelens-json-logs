import { eligibleFindSeed } from '../core/find-selection.ts';
import { fieldsSelectionHasSource } from '../core/find-fields-selection.ts';

const fieldsSources = new WeakMap<HTMLElement, { application: string; message?: string }>();
export function bindFieldsSeed(element: HTMLElement, application: string, message?: string): () => void {
  fieldsSources.set(element, { application, message });
  return () => { fieldsSources.delete(element); };
}

/** Inspect the real Range before focus moves. Every selected text node must
 * belong to an explicit source in the same row/inspector; labels never qualify.
 */
export function selectedFindSeed(root: HTMLElement): string | undefined {
  const selection = root.ownerDocument.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount !== 1) return;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return;
  const text = eligibleFindSeed(selection.toString());
  if (text === undefined) return;
  const walker = root.ownerDocument.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT);
  let node: Node | null = range.commonAncestorContainer.nodeType === Node.TEXT_NODE ? range.commonAncestorContainer : walker.nextNode();
  let owner: Element | undefined;
  const fields = new Map<HTMLElement, { start: number; end: number }>();
  while (node) {
    if (node.textContent && range.intersectsNode(node)) {
      // Boundary-only contact does not select characters in this node.
      const part = range.cloneRange();
      if (node !== range.startContainer) part.setStart(node, 0);
      if (node !== range.endContainer) part.setEnd(node, node.textContent.length);
      if (part.toString()) {
        const source = node.parentElement?.closest('[data-find-seed]');
        const record = source?.closest('.rl-row, .rl-detail');
        if (!source || !record || !root.contains(record) || (owner && owner !== record)) return;
        if (source.getAttribute('data-find-seed') === 'fields') {
          const fragment = node.parentElement?.closest<HTMLElement>('[data-source-start]');
          const start = Number(fragment?.dataset.sourceStart) + part.startOffset;
          if (!fragment) return;
          const interval = fields.get(source as HTMLElement);
          fields.set(source as HTMLElement, { start: Math.min(interval?.start ?? start, start),
            end: Math.max(interval?.end ?? 0, start + part.toString().length) });
        }
        owner = record;
      }
    }
    node = walker.nextNode();
  }
  for (const [source, interval] of fields) {
    const sources = fieldsSources.get(source);
    if (!sources || !fieldsSelectionHasSource(sources.application, source.textContent ?? '', interval.start, interval.end, sources.message)) return;
  }
  return owner ? text : undefined;
}
