import {connect,save,tick,assert} from './host.mjs';
import {nativeKeyboard} from './native-keyboard.mjs';
const h=await connect(),out={package:'0.1.33',input:'Trusted Chromium pointer click in actual inspector text; OS uinput Ctrl+F',checks:[]};let keyboard;
try{
 keyboard=await nativeKeyboard();
 await h.run(`(()=>{const r=document.querySelector('.readable-logs');let f=r[Object.keys(r).find(k=>k.startsWith('__reactFiber$'))];while(f&&!f.memoizedProps?.preferences)f=f.return;global.__cv30Pointer={preferences:f.memoizedProps.preferences,layout:f.memoizedProps.preferences.read().inspection};})()`);
 for(const layout of ['inline','side','bottom']){
  await h.run(`(()=>{const r=document.querySelector('.readable-logs');global.__cv30Pointer.preferences.setInspection(${JSON.stringify(layout)});[...r.querySelectorAll('button')].find(e=>e.textContent==='Pause')?.click();document.querySelector('.rl-row').click()})()`);await tick();
  await h.run(`document.querySelector('.rl-detail pre').scrollIntoView({block:'center'})`);await h.click(await h.point(`document.querySelector('.rl-detail pre')`,.1,true));
  const before=await h.run(`({focus:document.activeElement.tagName,class:document.activeElement.className})`);await keyboard.press('Ctrl+f');
  const after=await h.run(`({focus:document.activeElement.id||document.activeElement.className,findOpen:!document.querySelector('.rl-findbar').hidden})`);out.checks.push({layout,before,after});assert(after.findOpen&&after.focus==='rl-find',layout+': inspector text does not own Find');
  await h.run(`document.querySelector('[aria-label="Close Find"]')?.click()`);
 }
 out.passed=true;
}catch(error){out.failure=String(error);process.exitCode=1;}
finally{
 try{await h.run(`(()=>{document.querySelector('[aria-label="Close Find"]')?.click();document.querySelector('[aria-label="Close record inspector"]')?.click();const p=global.__cv30Pointer;if(p)p.preferences.setInspection(p.layout);delete global.__cv30Pointer;})()`);}
 finally{if(keyboard)await keyboard.close();await h.close();save('inspector-pointer',out);}
}
