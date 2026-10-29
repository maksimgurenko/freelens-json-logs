// Companion to native-window-lifecycle.mjs. The exact private window has already
// closed, so privateSession's mapped-window precondition no longer applies.
import assert from 'node:assert/strict';
import { connect } from './cdp.mjs';
import { evidence, scratch } from './config.mjs';
import { readFileSync } from 'node:fs';
const close=JSON.parse(readFileSync(`${evidence}/native-window-lifecycle.json`));
assert(close.checks.at(-1).pass&&close.checks.at(-1).close.destroyed);
assert.equal(close.session.pid,Number(readFileSync(`${scratch}/host-pid`)));
const main=await connect(9242); // Verifies PID and private profile/socket environment.
try{
  const before=await main.evaluate(`({pid:process.pid,windows:process.mainModule.require('electron').BrowserWindow.getAllWindows().length,workers:__findObserve.snapshot(),owners:__findMain.find.owners.size})`);
  assert.equal(before.windows,0);assert.equal(before.workers.live,0);assert.equal(before.owners,0);
  await main.evaluate(`(()=>{const E=process.mainModule.require('electron'),fs=process.mainModule.require('node:fs'),f=__findMain.find;E.app.once('will-quit',()=>fs.writeFileSync(${JSON.stringify(process.cwd()+'/'+evidence+'/shutdown-clean.json')},JSON.stringify({pid:process.pid,workers:__findObserve.snapshot(),service:{closed:f.closed,owners:f.owners.size,retiring:f.retiring.size,opening:f.opening.size,senders:f.senders.size,watch:!!f.stopWatch}},null,2)));setTimeout(()=>E.app.quit(),30);return true})()`);
}finally{main.close()}
