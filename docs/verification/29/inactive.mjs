// Supplemental forced delivery, while the real host hides/caches this frame.
import {connect,save,assert,tick} from './host.mjs';
const h=await connect(),out={package:'0.1.31',input:'DOM guard checks; not OS input evidence'};const history=await h.send('Page.getNavigationHistory');
try{
 out.unfocused=await h.run(`(()=>{const r=document.querySelector('.readable-logs'),e=r.querySelector('.rl-records');e.focus();const event=new KeyboardEvent('keydown',{key:'f',ctrlKey:true,bubbles:true,cancelable:true});e.dispatchEvent(event);return {documentFocus:document.hasFocus(),canceled:event.defaultPrevented,findOpen:!r.querySelector('.rl-findbar').hidden};})()`);
 assert(!out.unfocused.documentFocus&&!out.unfocused.canceled&&!out.unfocused.findOpen,'Unfocused view claimed input');
 const previous=history.entries.find(e=>e.url.endsWith('/extensions'));assert(previous,'Need real Extensions entry');await h.send('Page.navigateToHistoryEntry',{entryId:previous.id});await tick(150);
 out.cached=await h.run(`(()=>{const r=document.querySelector('.readable-logs');if(!r)throw Error('No cached cluster');const event=new KeyboardEvent('keydown',{key:'f',ctrlKey:true,bubbles:true,cancelable:true});r.querySelector('.rl-records').dispatchEvent(event);return {documentHidden:document.hidden,documentFocus:document.hasFocus(),rects:r.getClientRects().length,canceled:event.defaultPrevented,findOpen:!r.querySelector('.rl-findbar').hidden};})()`);assert(!out.cached.canceled&&!out.cached.findOpen,'Cached view claimed input');out.passed=true;
}catch(error){out.failure=String(error);process.exitCode=1;}
finally{try{await h.send('Page.navigateToHistoryEntry',{entryId:history.entries[history.currentIndex].id});await tick(200);}finally{await h.close();save('inactive',out);}}
