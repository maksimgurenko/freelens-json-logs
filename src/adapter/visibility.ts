export interface VisibilityChannel {
  listen(channel: string, received: (clusterId: string | null) => void): () => void;
  request(clusterId: string, reply: string): void;
  stop(reply: string): void;
}
export const VISIBILITY_REQUEST = 'viewer-visibility-request';
export const VISIBILITY_STOP = 'viewer-visibility-stop';

/** Wait for the owning native window's answer before fetching. A CSS-hidden
 * cluster frame can retain its own document visibility. */
export function bindVisibility(element: HTMLElement, clusterId: string,
  channel: VisibilityChannel, active: (value: boolean) => void) {
  const reply = `viewer-visibility-${crypto.randomUUID()}`;
  let parentVisible = false;
  const update = () => active(parentVisible && !element.ownerDocument.hidden);
  const stop = channel.listen(reply, selected => { parentVisible = selected === clusterId; update(); });
  element.ownerDocument.addEventListener('visibilitychange', update);
  update();
  channel.request(clusterId, reply);
  return () => {
    stop(); channel.stop(reply);
    element.ownerDocument.removeEventListener('visibilitychange', update);
  };
}
