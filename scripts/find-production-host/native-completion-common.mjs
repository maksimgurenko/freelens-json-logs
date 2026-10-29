// Verification only: native actions are pinned by isolatedInput to the fresh
// disposable compositor. DOM reads and setup navigation never manufacture focus.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFileSync,appendFileSync} from 'node:fs';
import {driver,report,sleep} from './driver.mjs';
import {isolatedInput,native,clipboard} from './native-input.mjs';
import {run,evidence} from './config.mjs';
export {assert,sleep,report,evidence,native,isolatedInput};
async function stopOwned(owned){
  await Promise.all(owned.map(async child=>{
   if(child.exitCode!==null||child.signalCode!==null)return;
   const exited=new Promise(resolve=>child.once('exit',resolve));
   const timer=setTimeout(()=>child.kill('SIGKILL'),1000);
   try{child.kill();await exited}finally{clearTimeout(timer)}
  }));
 }
export async function session(name){
 assert(['native-completion-20261028','native-ime-replacement-20261028'].includes(run));
 const d=await driver(),owned=[];
 try {
 const keep=spawn('wtype',['-s','7200000'],{env:isolatedInput().env,stdio:'ignore'});owned.push(keep);
 const pointer=spawn('.scratch/find/48-host/native-pointer-session',['1280','720'],{env:isolatedInput().env,stdio:['pipe','pipe','pipe']});owned.push(pointer);
 let setupError;keep.on('error',e=>setupError=e);pointer.on('error',e=>setupError=e);
 let pointerOutput='';pointer.stdout.on('data',b=>pointerOutput+=b);
 async function pointerCommand(args){const proof=isolatedInput();const before=pointerOutput.length;pointer.stdin.write(args.join(' ')+'\n');for(let i=0;i<200;i++){if(pointerOutput.slice(before).includes('done')){appendFileSync(`${evidence}/native-commands.jsonl`,JSON.stringify({at:new Date().toISOString(),command:'native-pointer-session',args,pid:pointer.pid,environment:proof.env})+'\n');return}await sleep(10)}throw Error('Private pointer command failed')}
 const read=x=>d.page.evaluate(x,d.cluster());
 const root=x=>d.page.evaluate(x,d.root());
 const key=(...args)=>native('wtype',['-s','40',...args,'-s','60']);
 const ctrl=k=>key('-M','ctrl','-k',k,'-m','ctrl');
 const result={route:'private Wayland virtual keyboard/pointer and private clipboard; native BrowserWindow API where stated',physicalHardware:false,packageSha256:JSON.parse(readFileSync(`${evidence}/package-identity.json`)).tarball.sha256,session:isolatedInput().session,checks:[]};
 const state=()=>read(`(()=>{const q=document.querySelector('#rl-find'),s=document.querySelector('.rl-records');return {query:q?.value,open:!!q?.getClientRects().length,focus:document.hasFocus(),focused:document.activeElement?.outerHTML.slice(0,220),active:Number(document.querySelector('.rl-find-current')?.dataset.recordIndex??-1),inspected:Number(document.querySelector('.rl-selected')?.dataset.recordIndex??-1),count:document.querySelector('.rl-find-count')?.textContent,selection:getSelection()?.toString(),scroll:s?.scrollTop,following:document.querySelector('.rl-follow-status')?.textContent,update:document.querySelector('.rl-update-status')?.textContent,history:!!document.querySelector('.rl-history-popover'),flags:['Match case','Whole words'].map(n=>document.querySelector('[aria-label="'+n+'"]')?.getAttribute('aria-pressed')),events:globalThis.__nativeCompletionEvents?.slice(-16)}})()`);
 async function until(fn,label){for(let i=0;i<120;i++){const s=await state();if(await fn(s))return s;await sleep(10)}throw Error(label+': '+JSON.stringify(await state()))}
 async function test(id,requirement,fn){const c={id,requirement,before:await state()};result.checks.push(c);try{await fn(c);c.pass=true}catch(e){c.pass=false;c.error=e.stack}c.after=await state();report(name,result);console.log(JSON.stringify({id,pass:c.pass,error:c.error?.split('\n')[0]}));return c.pass}
 async function point(r,context='cluster'){
  const {session}=isolatedInput();const w=JSON.parse(native('hyprctl',['clients','-j'])).find(c=>c.pid===session.pid);assert(w?.mapped);
  const m=JSON.parse(native('hyprctl',['monitors','-j']));assert.equal(m.length,1);assert.equal(m[0].width,1280);assert.equal(m[0].height,720);assert.equal(m[0].scale,1);
  const frame=context==='cluster'?await root(`document.querySelector('iframe').getBoundingClientRect().toJSON()`):{x:0,y:0};
  const p=[Math.round(w.at[0]+frame.x+r.x),Math.round(w.at[1]+frame.y+r.y)];assert(p[0]>=0&&p[0]<1280&&p[1]>=0&&p[1]<720,'Point outside private output');return p;
 }
 async function click(selector,context='cluster'){
  const evalAt=context==='cluster'?read:root;
  const r=await evalAt(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing '+${JSON.stringify(selector)});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML.slice(0,250)}})()`);
  assert(r.width&&r.height,'Empty native click rect');const p=await point(r,context);await pointerCommand(['click',...p.map(String)]);await sleep(80);return r;
 }
 async function button(text){const selector=await read(`(()=>{const b=[...document.querySelectorAll('.readable-logs button, .readable-logs summary')].find(e=>e.textContent.trim()===${JSON.stringify(text)}||e.getAttribute('aria-label')===${JSON.stringify(text)});if(!b)throw Error('Missing '+${JSON.stringify(text)});b.dataset.nativeClick='target';return '[data-native-click="target"]'})()`);try{return await click(selector)}finally{await read(`document.querySelector('[data-native-click="target"]')?.removeAttribute('data-native-click');true`)}}
 async function tabTo(selector){for(let i=0;i<200;i++){if(await read(`document.activeElement?.matches(${JSON.stringify(selector)})`))return;key('-k','Tab')}throw Error('Tab target missing '+selector)}
 async function query(text){if(!(await state()).open)await button('Find');ctrl('f');ctrl('a');if(text)key(text);else key('-k','BackSpace');await until(s=>s.query===text&&(text?s.count?.includes('matching records'):s.count==='Enter text to find'),'Native query ready');}
 async function navigate(which='traces'){
  const f=JSON.parse(readFileSync(`${evidence}/${which==='surfaces'?'surface-fixture':'fixture'}.json`));
  const clusterId=await read('LensExtensions.Renderer.Catalog.getActiveCluster().id');
  await read("LensExtensions.Renderer.Navigation.navigate('/overview');true");await d.wait(s=>!s.live&&!s.service.owners);
  await read(`__findRenderer.navigate('readable-logs',${JSON.stringify({namespace:f.namespace,pod:which==='surfaces'?f.pod:'find-fixtures',podUid:f.podUid,clusterId})});true`);
  await until(()=>read(`document.querySelectorAll('.rl-record').length===${which==='surfaces'?180:120}`),'Owned snapshot');
  key('-k','Tab');await pointerCommand(['move',50,300]);
  await read(`(()=>{globalThis.__nativeCompletionEvents=[];globalThis.__nativeCompletionRemove=[];for(const type of ['keydown','pointerdown','pointerup','click','wheel','beforeinput','input','compositionstart','compositionupdate','compositionend','focusin']){const f=e=>__nativeCompletionEvents.push({type,trusted:e.isTrusted,key:e.key,data:e.data,inputType:e.inputType,composing:e.isComposing,target:e.target?.id||e.target?.className,value:e.target?.value});document.addEventListener(type,f,true);__nativeCompletionRemove.push(()=>document.removeEventListener(type,f,true))}return true})()`);
 }
 async function drag(selector,start,end){
  if(selector.startsWith('.rl-detail')){await click('.rl-detail-head strong');await sleep(100)}
  // Range geometry only: never add a DOM Range to the document selection.
  const r=await read(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),walk=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),ns=[];let n;while(n=walk.nextNode())ns.push(n);const p=i=>{for(const n of ns){if(i<=n.length)return[n,i];i-=n.length}throw Error('Source offset')};const r=document.createRange();r.setStart(...p(${start}));r.setEnd(...p(${end}));for(let p=e.parentElement;p;p=p.parentElement){if(/auto|scroll/.test(getComputedStyle(p).overflowY)){const a=r.getBoundingClientRect(),b=p.getBoundingClientRect();p.scrollTop+=(a.top+a.bottom)/2-(b.top+p.clientTop+p.clientHeight/2)}}const a=document.createRange(),b=document.createRange();a.setStart(...p(${start}));a.setEnd(...p(${start+1}));b.setStart(...p(${end-1}));b.setEnd(...p(${end}));const first=[...a.getClientRects()].find(r=>r.width>0),last=[...b.getClientRects()].find(r=>r.width>0);return {start:{x:first.x+.3,y:first.y+first.height/2},end:{x:last.right-.3,y:last.y+last.height/2},text:r.toString()}})()`);
  const a=await point(r.start),b=await point(r.end);await pointerCommand(['drag',...a.concat(b).map(String)]);await sleep(100);return r;
 }
 async function reveal(selector){await read(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',inline:'nearest'});true`);await sleep(100)}
 async function wheel(delta){const r=await read(`(()=>{const r=document.querySelector('.rl-records').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`),p=await point(r);await pointerCommand(['scroll',...p.map(String),String(delta)]);await sleep(80)}
 async function layout(value){await button('Display options');await click('[aria-label="Inspection"]');key('-k','Home');for(let i=0;i<['inline','side','bottom'].indexOf(value);i++)key('-k','Down');key('-k','Return');await button('Display options');await sleep(100)}
 async function close(){
  try{
   try{result.events=await read('globalThis.__nativeCompletionEvents');await read('(()=>{for(const f of globalThis.__nativeCompletionRemove??[])f();delete globalThis.__nativeCompletionRemove;return true})()')}catch(e){result.cleanupError=String(e)}
   try{result.final=await state()}catch(e){result.finalProbeError=String(e)}
  }finally{try{await stopOwned(owned)}finally{d.close()}}
  result.pass=result.checks.length>0&&result.checks.every(c=>c.pass)&&!result.cleanupError&&!result.finalProbeError&&result.handlerRestored!==false&&result.dispatchRestored!==false;
  if(!result.pass)process.exitCode=1;report(name,result);
 }
  await sleep(200);assert(!setupError,String(setupError));assert(pointerOutput.includes('ready'),'Private pointer ready');await d.bind(d.cluster());
  return {d,result,read,root,state,key,ctrl,until,test,point,pointerCommand,click,button,tabTo,query,navigate,drag,reveal,wheel,layout,owned,close};
 }catch(error){try{await stopOwned(owned)}finally{d.close()}throw error}
}
