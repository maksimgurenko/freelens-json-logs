import {writeFileSync} from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {connect,assert,tick} from './host.mjs';
const h=await connect(),out={package:'0.1.28',physical:false,checks:[]},exec=promisify(execFile);
const check=async(name,expression)=>{const result=await h.run(expression);out.checks.push({name,result});assert(result,name);};
const originalUrl=await h.run('location.href');
try{
 await h.send('Page.bringToFront');
 for(const kind of ['menu','topbar']){
  await h.clickLabel('Edit profiles');await h.clickLabel('Duplicate');
  const before=await h.send('Page.getNavigationHistory');
  const action=async direction=>{
   if(kind==='menu'){
    const result=await exec(process.execPath,['docs/verification/28/main-eval.mjs','docs/verification/28/probes/native-menu-action.js','go-'+direction]);
    const reply=JSON.parse(result.stdout);assert(!reply.exceptionDetails,'Native menu callback failed');return reply.result.value;
   }
   const p=await h.rootRun(`(() => {const icon=[...document.querySelectorAll('.Icon')].find(e=>e.textContent.trim()===${JSON.stringify('arrow_')}+${JSON.stringify(direction)});if(!icon)throw Error('Top-bar action absent');const b=icon.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2};})()`);
   await h.click(p);await tick(120);return {input:'trusted pointer click on real native top-bar '+direction};
  };
  const back=await action('back');
  await check(kind+' Back keeps host ownership from dirty Profiles',`location.href!==${JSON.stringify(originalUrl)}&&!document.querySelector('.readable-logs')`);
  const afterBack=await h.send('Page.getNavigationHistory');assert(afterBack.currentIndex===before.currentIndex-1,kind+' double Back');
  const forward=await action('forward');await tick(100);
  await check(kind+' Forward returns without resurrecting discarded draft',`location.href===${JSON.stringify(originalUrl)}&&!!document.querySelector('.readable-logs')&&!document.querySelector('.rl-profile-editor')`);
  const afterForward=await h.send('Page.getNavigationHistory');assert(afterForward.currentIndex===before.currentIndex,kind+' wrong Forward');
  out[kind]={back,forward,before:before.currentIndex,afterBack:afterBack.currentIndex,afterForward:afterForward.currentIndex};
 }
 out.passed=true;
}catch(error){out.failure=String(error);throw error;}
finally{
 try{out.cleanup=await h.run(`(() => {const r=document.querySelector('.readable-logs');if(!r)return {viewerAbsent:true};[...r.querySelectorAll('button')].find(e=>e.textContent==='Back to logs')?.click();[...r.querySelectorAll('button')].find(e=>e.textContent==='Pause')?.click();r.querySelector('.rl-edit-profiles').focus();return {paused:true,noDraft:!r.querySelector('.rl-profile-editor')};})()`);}
 finally{await h.close();writeFileSync('docs/verification/28/native-history.json',JSON.stringify(out,null,2)+'\n');}
}
