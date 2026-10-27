// Native window destruction is confined to the proven separate session. No
// activation, input injection, focus restoration, clipboard or pointer operation.
import assert from 'node:assert/strict';
import { driver, request, report } from './driver.mjs';
import { privateSession } from './private-session.mjs';
const evidence = { session: privateSession() }, d = await driver();
try {
  await d.bind(d.root());
  const token = await d.rpc(d.root(), 'find-open', 'native-window-idle');
  assert.equal((await d.rpc(d.root(), 'find-request', token, request(1))).kind, 'matches');
  evidence.before = await d.status(); assert.equal(evidence.before.live, 1);
  await d.main.evaluate(`(()=>{const E=process.mainModule.require('electron');const w=E.BrowserWindow.getAllWindows().find(w=>w.webContents.id===global.__findMain.find.owners.values().next().value.sender.id);if(!w)throw Error('Owning window missing');w.destroy();return true;})()`);
  evidence.after = await d.wait(s => !s.live && !s.service.owners && !s.service.retiring);
  assert.equal(evidence.after.windows.length, 0); assert.equal(evidence.after.service.senders, 0); assert.equal(evidence.after.service.watch, false);
  evidence.pass = true;
} catch (error) { evidence.error = error.stack; process.exitCode = 1; }
finally { report('native-window-close', evidence); console.log(JSON.stringify({ pass: evidence.pass, error: evidence.error })); d.close(); }
