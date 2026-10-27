(()=>{
 const r=process.mainModule.require.bind(process.mainModule), fs=r('node:fs'), p=r('node:path'), E=r('electron');
 if(!process.env.FREELENS_INTEGRATION_TESTING_DIR.startsWith('/tmp/freelens-production-find-42-'))throw Error('Nonisolated host');
 global.__findObserve={events:[],live:new Set(),starts:0,exits:0,peak:0};
 const state=global.__findObserve, log=x=>{const value={at:Date.now(),...x};state.events.push(value);fs.appendFileSync('/home/max/work/freelens-json-logs/docs/verification/42/host/worker-events.jsonl',JSON.stringify(value)+'\n');};
 const threads=r('node:worker_threads'), Original=threads.Worker;
 threads.Worker=class extends Original {constructor(...args){super(...args);state.starts++;state.live.add(this);state.peak=Math.max(state.peak,state.live.size);log({event:'worker-start',threadId:this.threadId});this.once('exit',code=>{state.live.delete(this);state.exits++;log({event:'worker-exit',code,live:state.live.size});});}};
 const base=p.join(process.env.FREELENS_INTEGRATION_TESTING_DIR,'Freelens/node_modules/freelens-readable-logs');
 const entry=p.join(base,'out/main-0.1.34.js');
 global.__findProductionPrototype=r(entry).default.prototype;
 state.snapshot=()=>({starts:state.starts,exits:state.exits,live:state.live.size,peak:state.peak,resources:process.getActiveResourcesInfo(),beforeQuit:E.app.listenerCount('before-quit'),handlers:[...E.ipcMain._invokeHandlers.keys()].filter(x=>x.endsWith(':find-open')||x.endsWith(':find-request')||x.endsWith(':find-control')),windows:E.BrowserWindow.getAllWindows().map(w=>({id:w.id,pid:w.webContents.getOSProcessId(),frames:w.webContents.mainFrame.framesInSubtree.map(f=>({processId:f.processId,routingId:f.routingId,url:f.url})),listeners:['destroyed','render-process-gone','did-frame-navigate'].map(n=>[n,w.webContents.listenerCount(n)])}))});
 process.once('exit',()=>log({event:'process-exit',...state.snapshot()}));
 return {entry,cwd:process.cwd(),pid:process.pid,versions:process.versions,state:state.snapshot()};
})()
