// Trusted Chromium pointer reproduction, not physical/OS Back evidence.
import {connect,save,assert,tick} from './host.mjs';
import {chromium} from '../../../.scratch/compact-view/26/browser-driver/node_modules/playwright-core/index.mjs';
const h=await connect(),browser=await chromium.connectOverCDP('http://127.0.0.1:9235');
const page=browser.contexts()[0].pages()[0],label=process.argv[2]??'back-panel';
const out={provenance:'Trusted CDP Chromium Back input in installed host; supplemental to physical gate'};
const history=await h.send('Page.getNavigationHistory');
try{
 await h.clickLabel('Edit profiles');await h.clickLabel('Duplicate');
 await h.run(`(()=>{const root=document.querySelector('.readable-logs');global.__cv30Panel={events:[]};const p=global.__cv30Panel;p.observer=e=>{if(e.button!==3)return;const record={type:e.type,target:e.target.className,focus:document.activeElement.tagName,documentFocus:document.hasFocus(),prevented:e.defaultPrevented};p.events.push(record);setTimeout(()=>{record.afterPrevented=e.defaultPrevented;record.afterFocus=document.activeElement.tagName;},0);};for(const t of ['pointerdown','pointerup','mouseup','auxclick'])window.addEventListener(t,p.observer,true);document.querySelector('[aria-label="Profile name"]').focus();})()`);
 const point=await h.run(`(()=>{const e=document.querySelector('.rl-editor-fields'),b=e.getBoundingClientRect();for(let y=b.top+4;y<b.bottom;y+=13)for(let x=b.left+4;x<b.right;x+=13)if(document.elementFromPoint(x,y)===e)return {x,y};throw Error('No panel-space hit target')})()`);
 const p={x:point.x+h.offset.x,y:point.y+h.offset.y};
 await page.mouse.move(p.x,p.y);await h.send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'back',buttons:8,clickCount:1});await tick(30);
 out.pressed=await h.run(`({focus:document.activeElement.tagName,profiles:!!document.querySelector('.rl-profile-editor')})`);
 await page.mouse.move(p.x+2,p.y+2);await h.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x+2,y:p.y+2,button:'back',buttons:0,clickCount:1});await tick(80);
 out.after=await h.run(`({version:document.querySelector('.readable-logs').dataset.version,profiles:!!document.querySelector('.rl-profile-editor'),events:global.__cv30Panel.events})`);
 out.historyBefore=history.currentIndex;out.historyAfter=(await h.send('Page.getNavigationHistory')).currentIndex;
 out.passed=!out.after.profiles&&out.historyAfter===out.historyBefore&&['mouseup','auxclick'].every(t=>out.after.events.some(e=>e.type===t&&e.afterPrevented));
 assert(out.passed,'Back in Profiles panel space must return once without host navigation');
}catch(error){out.failure=String(error);process.exitCode=1;}
finally{
 await h.send('Page.navigateToHistoryEntry',{entryId:history.entries[history.currentIndex].id});await tick(100);
 await h.run(`(()=>{const p=global.__cv30Panel;if(p){for(const t of ['pointerdown','pointerup','mouseup','auxclick'])window.removeEventListener(t,p.observer,true);delete global.__cv30Panel;}[...document.querySelectorAll('.rl-profile-editor button')].find(e=>e.textContent==='Back to logs')?.click();})()`);
 await browser.close();await h.close();save(label,out);
}
