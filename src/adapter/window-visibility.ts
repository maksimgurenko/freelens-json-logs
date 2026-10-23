interface Events {
  on(event: string, callback: () => void): unknown;
  removeListener(event: string, callback: () => void): unknown;
}
export interface VisibleWindow extends Events {
  isDestroyed(): boolean;
  isVisible(): boolean;
  isMinimized(): boolean;
  webContents: Events & { getURL(): string };
}

/** Standard Electron events observe the owning window, including CSS-hidden
 * cluster routes. Focus/blur do not affect eligibility. No host internals are patched. */
export function watchWindowVisibility(window: VisibleWindow, clusterId: string,
  received: (clusterId: string | null) => void) {
  const emit = () => {
    let selected: string | null = null;
    if (!window.isDestroyed() && window.isVisible() && !window.isMinimized()) {
      try {
        const path = new URL(window.webContents.getURL()).pathname;
        if (path === `/cluster/${encodeURIComponent(clusterId)}`) selected = clusterId;
      } catch { /* A window without a loaded document is not an active viewer. */ }
    }
    received(selected);
  };
  const events = ['show', 'hide', 'minimize', 'restore', 'closed'];
  const navigation = ['did-navigate', 'did-navigate-in-page'];
  for (const event of events) window.on(event, emit);
  for (const event of navigation) window.webContents.on(event, emit);
  emit();
  return () => {
    for (const event of events) window.removeListener(event, emit);
    for (const event of navigation) window.webContents.removeListener(event, emit);
  };
}
