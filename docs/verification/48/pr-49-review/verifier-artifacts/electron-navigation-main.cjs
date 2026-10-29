// Headless Electron webContents only; no BrowserWindow, display, native input or clipboard.
const assert = require('node:assert/strict');
const { EventEmitter, once } = require('node:events');
const { createServer } = require('node:http');
const { app, WebContentsView, ipcMain } = require('electron');
const { FindService } = require('./find-service.cjs');
app.commandLine.appendSwitch('ozone-platform', 'headless');
app.commandLine.appendSwitch('headless');
app.disableHardwareAcceleration();
app.setPath('userData', __dirname + '/settings');
const timeout = setTimeout(() => app.exit(2), 20000); timeout.unref();
class Worker extends EventEmitter {
  stopping = false;
  postMessage() {}
  async terminate() { this.stopping = true; return 1; }
}
const input = { requestId: 1, key: { viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1, windowRevision: 1, messageRevision: 1, queryRevision: 1 },
  query: { text: 'a', matchCase: false, wholeWords: false }, records: [{ ref: { context: 'one', occurrence: 0 }, application: 'a' }], work: 'match' };
const ids = frame => ({ processId: frame.processId, routingId: frame.routingId, treeNode: frame.frameTreeNodeId, url: frame.url });
const sameId = (a,b) => a.processId === b.processId && a.routingId === b.routingId;
let server;
app.whenReady().then(async () => {
  server = createServer((req,res) => { res.setHeader('Cache-Control', 'no-store'); res.end(req.url.startsWith('/main') ? '<iframe src="/child?first"></iframe>' : '<p>child</p>'); });
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const observations = [];
  for (const target of ['main','child']) for (const navigation of ['none','hash','same-origin','reload']) {
    const view = new WebContentsView({ webPreferences: { nodeIntegration: true, nodeIntegrationInSubFrames: true, contextIsolation: false, sandbox: false } });
    const wc = view.webContents;
    let service;
    try {
      await wc.loadURL(origin + '/main?first');
      const frame = target === 'main' ? wc.mainFrame : wc.mainFrame.frames[0];
      const before = ids(frame), caller = { sender: wc, senderFrame: frame }, workers = [];
      let watches = 0, sweep = () => {};
      service = new FindService(() => { const worker = new Worker(); workers.push(worker); return worker; }, 'test', run => { sweep = run; watches++; return () => watches--; });
      let invoked;
      ipcMain.handle('pr49-open', (event, viewer) => {
        const result = service.open(event, viewer);
        invoked = { event, result };
        return result;
      });
      const old = await frame.executeJavaScript("require('electron').ipcRenderer.invoke('pr49-open','viewer')");
      const firstInvokeFrameSameObject = invoked.event.senderFrame === frame;
      const pendingMatch = service.submit(caller, old, input);
      const prior = invoked;
      let rendererInvocationError;
      void frame.executeJavaScript("require('electron').ipcRenderer.invoke('pr49-open','viewer')").catch(error => { rendererInvocationError = String(error); });
      for (let i=0; invoked === prior && i<100; i++) await new Promise(resolve => setImmediate(resolve));
      assert.notEqual(invoked, prior, 'Actual IPC replacement did not arrive');
      const capturedEvent = invoked.event;
      const opening = invoked.result.then(token => ({ ok: true, token }), error => ({ ok: false, error: String(error) }));
      assert(workers[0].stopping);
      assert.equal(wc.listenerCount('did-frame-navigate'), 0);
      const events=[];
      wc.on('did-frame-navigate', (_ev,url,_code,_status,main,processId,routingId) => events.push({ event:'did-frame-navigate', url, main, processId, routingId }));
      wc.on('did-navigate-in-page', (_ev,url,main,processId,routingId) => events.push({ event:'did-navigate-in-page', url, main, processId, routingId }));
      if (navigation === 'hash') {
        const event = once(wc,'did-navigate-in-page');
        await frame.executeJavaScript("location.hash = 'control'"); await event;
      } else if (navigation !== 'none') {
        if (target === 'main') {
          if (navigation === 'reload') { const loaded = once(wc,'did-finish-load'); wc.reload(); await loaded; }
          else await wc.loadURL(origin + '/main?replacement');
        } else {
          const event = once(wc,'did-frame-navigate');
          await frame.executeJavaScript(navigation === 'reload' ? 'location.reload()' : `location.href = ${JSON.stringify(origin+'/child?replacement')}`).catch(() => {});
          await event;
        }
      }
      const after = ids(target === 'main' ? wc.mainFrame : wc.mainFrame.frames[0]);
      workers[0].emit('exit',1);
      const result = await opening;
      assert.equal(await pendingMatch, undefined);
      sweep(); await Promise.resolve();
      const registeredIdentities = [...service.owners.values()].map(owner=>({processId:owner.processId,routingId:owner.routingId}));
      const remains = { owners:service.owners.size, senders:service.senders.size, watches, opening:service.opening.size, retiring:service.retiring.size };
      observations.push({ target,navigation,before,after,sameProcessAndRouting:sameId(before,after),events,registration: result.ok ? 'accepted' : result.error, actualIpc: true, firstInvokeFrameSameObject, registeredIdentities, housekeepingSweepExecuted:true, eventSenderFrameAfter: (()=>{try{return capturedEvent.senderFrame ? ids(capturedEvent.senderFrame):null}catch(error){return String(error)}})(), rendererInvocationError, capturedFrameAfter: (()=>{try{return ids(frame)}catch(error){return String(error)}})(), remains });
      if (['none','hash'].includes(navigation)) {
        assert(sameId(before,after)); assert(result.ok); assert.equal(remains.owners,1);
        await service.close({sender:wc,senderFrame:target==='main'?wc.mainFrame:wc.mainFrame.frames[0]},result.token);
      } else {
        assert(!sameId(before,after), 'Cross-document navigation retained IDs: the reviewer premise is reachable');
        if (process.env.PR49_ASSERT_FIXED === '1') { assert(!result.ok, 'Departed document registration survived real navigation'); assert.equal(remains.owners,0); assert.equal(watches,0); }
      }
      await service.dispose();
    } finally { await service?.dispose(); ipcMain.removeHandler('pr49-open'); wc.destroy(); }
  }
  console.log(JSON.stringify({ electron:process.versions.electron,chrome:process.versions.chrome,
    scope:'actual ipcMain.handle from renderer ipcRenderer.invoke in standalone headless webContents with real public frame IDs/events and unchanged production FindService; controlled Worker stand-in',observations },null,2));
  server.close(); clearTimeout(timeout); app.quit();
}).catch(error => { console.error(error); server?.close(); app.exit(1); });
