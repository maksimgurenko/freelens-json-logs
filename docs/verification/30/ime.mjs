// Real compositor text-input path via a short-lived owned Wayland input method.
// No DOM composition injection, keyboard grab, popup, system setting or clipboard.
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {connect,save,assert,tick} from './host.mjs';
import {nativeKeyboard} from './native-keyboard.mjs';
const h=await connect(),out={package:'0.1.33',provenance:'Owned Wayland input-method-v2 -> Hyprland text-input -> native Electron; OS uinput Ctrl+S/Escape; no DOM composition dispatch'};
let child,keyboard,receive,send;
try{
 await h.send('Page.bringToFront');await h.clickLabel('Edit profiles');await h.clickLabel('Duplicate');
 await h.run(`(()=>{const r=document.querySelector('.readable-logs');let f=r[Object.keys(r).find(k=>k.startsWith('__reactFiber$'))];while(f&&!f.memoizedProps?.preferences)f=f.return;const e=r.querySelector('[aria-label="Profile name"]');e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'CV30 IME draft');e.dispatchEvent(new Event('input',{bubbles:true}));global.__cv30Ime={preferences:f.memoizedProps.preferences,config:structuredClone(f.memoizedProps.preferences.read().configuration),events:[]};const p=global.__cv30Ime;p.listener=event=>{if(!r.contains(event.target))return;const row={type:event.type,trusted:event.isTrusted,key:event.key,data:event.data,composing:event.isComposing,target:event.target.getAttribute('aria-label'),prevented:event.defaultPrevented};p.events.push(row);setTimeout(()=>row.afterPrevented=event.defaultPrevented,0);};for(const type of ['compositionstart','compositionupdate','compositionend','beforeinput','input','keydown'])r.addEventListener(type,p.listener,true);})()`);
 child=spawn('.scratch/compact-view/30/ime-driver',[],{stdio:['pipe','pipe','pipe']});let stderr='';child.stderr.on('data',data=>stderr+=data);out.driverStderr=()=>stderr;
 const lines=createInterface({input:child.stdout}),queued=[],waiters=[];lines.on('line',line=>{const data=JSON.parse(line),w=waiters.shift();w?w(data):queued.push(data);});
 receive=()=>queued.length?Promise.resolve(queued.shift()):new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('IME reply timeout')),2000);waiters.push(data=>{clearTimeout(timer);resolve(data);});});
 send=async command=>{child.stdin.write(command+'\n');return receive();};out.ready=await receive();assert(!out.ready.unavailable,'Existing input method retains its ownership; no takeover attempted');
 for(let i=0;i<10;i++){out.status=await send('S');if(out.status.active)break;await tick(100);}
 assert(out.status.active,'Native Electron did not activate compositor text input under this launch');
 keyboard=await nativeKeyboard();out.preedit=await send('P');await tick(150);
 out.started=await h.run(`global.__cv30Ime.events.some(e=>e.type==='compositionstart'&&e.trusted)`);assert(out.started,'No trusted native compositionstart');
 await keyboard.press('Ctrl+s');await keyboard.press('Escape');await tick(80);
 out.draftRetained=await h.run(`!!document.querySelector('.rl-profile-editor')&&!document.querySelector('[aria-label="Profile name"]').disabled&&global.__cv30Ime.preferences.read().configuration.profiles.length===global.__cv30Ime.config.profiles.length`);
 assert(out.draftRetained,'IME Save/Escape changed local draft context');
 out.commit=await send('C');await tick(120);out.events=await h.run('global.__cv30Ime.events');
 assert(out.events.some(e=>e.type==='compositionend'),'No completion event after native protocol commit');out.completionTrustBoundary='Compositionend is observed with isTrusted=false on this host; no trusted-end claim. The actual compositor preedit/commit path and trusted start/input/composing OS keys establish native provenance.';
 out.committedName=await h.run(`document.querySelector('[aria-label="Profile name"]').value`);assert(out.committedName==='CV30 IME draftあ','Native IME commit did not preserve the input exactly');await keyboard.press('Ctrl+s');out.saveAfterCommit=await h.run(`document.querySelector('[aria-label="Profile name"]').disabled&&global.__cv30Ime.preferences.read().configuration.profiles.some(p=>p.name==='CV30 IME draftあ')`);assert(out.saveAfterCommit,'Normal Save did not resume after composition');out.passed=true;
}catch(error){out.failure=String(error);process.exitCode=1;}
finally{
 if(child){if(child.exitCode===null){child.stdin.end('Q\n');await new Promise(resolve=>child.once('exit',resolve));}out.driverExit=child.exitCode;}
 try{out.cleanup=await h.run(`(()=>{const p=global.__cv30Ime;if(!p)return {notStarted:true};const r=document.querySelector('.readable-logs');for(const type of ['compositionstart','compositionupdate','compositionend','beforeinput','input','keydown'])r.removeEventListener(type,p.listener,true);const events=p.events;[...r.querySelectorAll('button')].find(e=>e.textContent==='Cancel draft')?.click();[...r.querySelectorAll('button')].find(e=>e.textContent==='Back to logs')?.click();for(const profile of [...p.preferences.read().configuration.profiles])if(!p.config.profiles.some(x=>x.id===profile.id)&&profile.name.startsWith('CV30 IME'))p.preferences.deleteProfile(profile.id);const restored=JSON.stringify(p.preferences.read().configuration)===JSON.stringify(p.config);delete global.__cv30Ime;return {configurationRestored:restored,events};})()`);}finally{if(keyboard)await keyboard.close();await h.close();if(typeof out.driverStderr==='function')out.driverStderr=out.driverStderr();save('ime',out);}
}
