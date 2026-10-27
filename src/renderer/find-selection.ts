import { eligibleFindSeed } from '../core/find-selection.ts';

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
        owner = record;
      }
    }
    node = walker.nextNode();
  }
  return owner ? text : undefined;
}
