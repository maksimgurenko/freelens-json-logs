export interface VisibilityChannel {
  listen(channel: string, received: (clusterId: string | null) => void): () => void;
  broadcast(channel: string, ...args: (string | null)[]): void;
}
export const VISIBILITY_REQUEST = 'viewer-visibility-request';
export const VISIBILITY_STOP = 'viewer-visibility-stop';

/** Wait for the owning native window's answer before fetching. A CSS-hidden
 * cross-origin cluster frame retains its own document visibility in 1.10.3. */
export function bindVisibility(element: HTMLElement, clusterId: string,
  channel: VisibilityChannel, active: (value: boolean) => void) {
  const reply = `viewer-visibility-${crypto.randomUUID()}`;
  let parentVisible = false;
  const update = () => active(parentVisible && !element.ownerDocument.hidden);
  const stop = channel.listen(reply, selected => { parentVisible = selected === clusterId; update(); });
  element.ownerDocument.addEventListener('visibilitychange', update);
  update();
  channel.broadcast(VISIBILITY_REQUEST, clusterId, reply);
  return () => {
    stop(); channel.broadcast(VISIBILITY_STOP, reply);
    element.ownerDocument.removeEventListener('visibilitychange', update);
  };
}
