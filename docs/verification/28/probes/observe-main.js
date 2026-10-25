(() => {
  if (globalThis.__cv28MainObservation) throw Error('Owning-window observer already exists');
  const {BrowserWindow} = process.getBuiltinModule('module').createRequire(process.execPath)('electron');
  const owner = BrowserWindow.getAllWindows().find(window => window.webContents.getURL() === __ROOT_URL_JSON__);
  if (!owner) throw Error('Exact owning BrowserWindow not found');
  const contents = owner.webContents, cleanups = [];
  const state = () => ({at: new Date().toISOString(), pid: process.pid, windowId: owner.id, webContentsId: contents.id,
    focusedWindowId: BrowserWindow.getFocusedWindow()?.id, focused: owner.isFocused(),
    rootUrl: contents.getURL(), focusedFrame: contents.focusedFrame ? {
      url: contents.focusedFrame.url, processId: contents.focusedFrame.processId, routingId: contents.focusedFrame.routingId,
    } : null, historyIndex: contents.navigationHistory.getActiveIndex(), historyLength: contents.navigationHistory.length()});
  const attach = (emitter, type, record) => {
    const listener = (...args) => { const data = record(...args); if (data) globalThis.__cv28NativeTraceEvent(JSON.stringify({...state(), type, ...data})); };
    emitter.on(type, listener); cleanups.push(() => emitter.removeListener(type, listener));
  };
  globalThis.__cv28MainObservation = {stop: () => { for (const cleanup of cleanups) cleanup(); }};
  attach(owner, 'app-command', (event, command) => ({command, defaultPrevented: event.defaultPrevented}));
  attach(contents, 'before-mouse-event', (event, mouse) => mouse.type === 'mouseDown' || mouse.type === 'mouseUp'
    ? {mouse, defaultPrevented: event.defaultPrevented} : undefined);
  attach(contents, 'did-start-navigation', (event, details) => ({details}));
  attach(contents, 'did-navigate-in-page', (event, url, mainFrame, frameProcessId, frameRoutingId) => ({url, mainFrame, frameProcessId, frameRoutingId}));
  return {...state(), listeners: cleanups.length, cancellation: false};
})()
