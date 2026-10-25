import {connect,save,assert,tick} from './host.mjs';
import {nativeKeyboard} from './native-keyboard.mjs';
const h=await connect(),out={package:'0.1.33',input:'trusted Chromium pointer drag plus OS uinput Ctrl+F',checks:[]};let keyboard;
try {
 keyboard=await nativeKeyboard();
 out.before=await h.run(`({nativeQuery:document.querySelector('.PodLogs .LogSearch input')?.value,dock:[...document.querySelectorAll('.Dock .Tab')].map(e=>({id:e.id,class:e.className})),markup:document.querySelector('.PodLogs .list, .PodLogs .LogList')?.outerHTML.slice(0,2400)})`);
 const points=await h.run(`(()=>{const root=document.querySelector('.PodLogs .list, .PodLogs .LogList');if(!root)throw Error('Native Logs not mounted');const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(n.textContent.includes('freelens-json-logs-spike')){const start=n.textContent.indexOf('freelens-json-logs-spike'),a=document.createRange(),b=document.createRange();a.setStart(n,start);a.setEnd(n,start+1);b.setStart(n,start+21);b.setEnd(n,start+22);const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return {a:{x:x.x+1,y:x.y+x.height/2},b:{x:y.right-1,y:y.y+y.height/2}};}}throw Error('No native text geometry')})()`);
 const a={x:points.a.x+h.offset.x,y:points.a.y+h.offset.y},b={x:points.b.x+h.offset.x,y:points.b.y+h.offset.y};
 await h.drag(a,b);
 out.selected=await h.run('window.getSelection().toString()');assert(out.selected.length>8,'Native drag selection missing');
 await h.run(`(()=>{const r=document.querySelector('.readable-logs');[...r.querySelectorAll('button')].find(e=>e.textContent==='Pause')?.click();document.querySelector('.rl-records').focus({preventScroll:true});})()`);
 out.beforeKey=await h.run(`({nativeQuery:document.querySelector('.PodLogs .LogSearch input').value,selection:window.getSelection().toString(),focus:document.activeElement.className,documentFocus:document.hasFocus(),rows:document.querySelectorAll('.rl-row').length,transients:!!document.querySelector('.readable-logs select:open, .readable-logs details[open], .rl-shortcuts, [data-local-confirmation]')})`);
 await keyboard.press('Ctrl+f');
 out.afterKey=await h.run(`({nativeQuery:document.querySelector('.PodLogs .LogSearch input').value,selection:window.getSelection().toString(),focus:document.activeElement.id,localFindOpen:!document.querySelector('.rl-findbar').hidden})`);
 assert(out.afterKey.localFindOpen&&out.afterKey.focus==='rl-find','Local Find did not exclusively own focus');
 assert(out.afterKey.nativeQuery===out.beforeKey.nativeQuery,'Earlier native capture changed native query from stale selection');
 out.passed=true;
}catch(error){out.failure=String(error);process.exitCode=1;}
finally{
 try{await h.run(`(()=>{const e=document.querySelector('.PodLogs .LogSearch input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(out.before?.nativeQuery??'')});e.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[aria-label="Close Find"]')?.click();window.getSelection().removeAllRanges();document.querySelector('.rl-records').focus({preventScroll:true});})()`);}finally{if(keyboard)await keyboard.close();await h.close();save(out.passed?'find-conflict':'preliminary-find-conflict-second',out);}
}
