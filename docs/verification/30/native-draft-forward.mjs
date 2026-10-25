// Actual host-page history and OS accelerators; no fabricated history entries.
import {readFileSync} from 'node:fs';
import {connect,save,assert,tick} from './host.mjs';
import {nativeKeyboard} from './native-keyboard.mjs';
const h=await connect(),out={package:'0.1.33',input:'OS uinput Ctrl+[ / Ctrl+] after actual Pods-page and Pod-header navigation'};
const history=await h.send('Page.getNavigationHistory');let keyboard;
try{
 keyboard=await nativeKeyboard();await h.run(`global.LensExtensions.Renderer.Navigation.navigate('/pods')`);await tick(180);
 await h.run(readFileSync('docs/verification/30/probes/show-original.js','utf8'));
 await h.run(readFileSync('docs/verification/30/probes/header.js','utf8'));
 out.entry=await h.run(readFileSync('docs/verification/30/probes/usable.js','utf8'));
 await h.clickLabel('Edit profiles');await h.clickLabel('Duplicate');
 await h.run(`(()=>{const e=document.querySelector('[aria-label="Profile name"]');e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'CV30 native Forward must not resurrect');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 out.before=await h.send('Page.getNavigationHistory');await keyboard.press('Ctrl+[');await tick(160);
 out.back=await h.run(`({url:location.href,viewer:!!document.querySelector('.readable-logs')})`);out.backIndex=(await h.send('Page.getNavigationHistory')).currentIndex;
 assert(!out.back.viewer&&out.backIndex===out.before.currentIndex-1,'Native Back must leave/unmount the viewer once');
 await keyboard.press('Ctrl+]');await tick(120);await h.run(readFileSync('docs/verification/30/probes/usable.js','utf8'));
 out.forward=await h.run(`({url:location.href,profiles:!!document.querySelector('.rl-profile-editor'),query:document.querySelector('#rl-find').value,selected:!!document.querySelector('.rl-selected')})`);out.forwardIndex=(await h.send('Page.getNavigationHistory')).currentIndex;
 assert(!out.forward.profiles&&!out.forward.query&&!out.forward.selected&&out.forwardIndex===out.before.currentIndex,'Forward resurrected discarded local state');
 await h.clickLabel('Edit profiles');out.reopened=await h.run(`({name:document.querySelector('[aria-label="Profile name"]').value,readonly:document.querySelector('[aria-label="Profile name"]').disabled,containsDiscarded:document.querySelector('.rl-profile-editor').textContent.includes('CV30 native Forward must not resurrect')})`);
 assert(out.reopened.readonly&&!out.reopened.containsDiscarded,'Profiles resurrected unfinished draft after native Forward');out.passed=true;
}catch(error){out.failure=String(error);process.exitCode=1;}
finally{
 try{await h.send('Page.navigateToHistoryEntry',{entryId:history.entries[history.currentIndex].id});await tick(160);await h.run(readFileSync('docs/verification/30/probes/usable.js','utf8'));await h.run(`(()=>{const r=document.querySelector('.readable-logs');[...r.querySelectorAll('button')].find(e=>e.textContent==='Back to logs')?.click();[...r.querySelectorAll('button')].find(e=>e.textContent==='Pause')?.click();})()`);}finally{if(keyboard)await keyboard.close();await h.close();save('native-draft-forward',out);}
}
