import{writeFileSync}from'node:fs';import{connect,save,assert,tick}from'./host.mjs';
const h=await connect(),out={package:'0.1.33',checks:[]};
try{
 await h.click(await h.point(`document.querySelector('.rl-display-options > summary')`));await h.clickLabel('Shortcuts');await h.click(await h.point(`document.querySelector('.rl-shortcuts p')`,.2));out.pointerFocus=await h.run(`document.activeElement.className`);await h.key('Escape','Escape',27);out.pointerDismiss=await h.run(`!document.querySelector('.rl-shortcuts')&&document.activeElement===document.querySelector('.rl-display-options > summary')`);assert(out.pointerDismiss,'Reference text pointer focus did not support Escape');
 await h.click(await h.point(`document.querySelector('.rl-display-options > summary')`));await h.clickLabel('Shortcuts');
 for(const mode of ['desktop','narrow']){
  if(mode==='narrow'){await h.send('Emulation.setDeviceMetricsOverride',{width:600,height:900,deviceScaleFactor:1,mobile:false});await tick(150);}
  const info=await h.run(`(()=>{const r=document.querySelector('.readable-logs'),p=document.querySelector('.rl-shortcuts'),cs=getComputedStyle(p);return {rootWidth:r.clientWidth,rootScrollWidth:r.scrollWidth,panelWidth:p.clientWidth,panelScrollWidth:p.scrollWidth,panelHeight:p.clientHeight,panelScrollHeight:p.scrollHeight,font:cs.fontSize,padding:cs.padding,color:cs.color,background:cs.backgroundColor,hints:[...r.querySelectorAll('[title]')].map(e=>e.title).filter(t=>/Ctrl/.test(t)),focus:document.activeElement.className}})()`);
  assert(info.rootScrollWidth<=info.rootWidth&&info.panelScrollWidth<=info.panelWidth,mode+' horizontal overflow');out.checks.push({mode,...info});
  const shot=await h.send('Page.captureScreenshot',{format:'png'});writeFileSync('docs/verification/30/shortcuts-'+mode+'.png',Buffer.from(shot.data,'base64'));
 }
 out.passed=true;
}catch(error){out.failure=String(error);process.exitCode=1;}
finally{try{await h.send('Emulation.clearDeviceMetricsOverride');await h.run(`document.querySelector('[aria-label="Close shortcuts"]')?.click();document.querySelector('.rl-records').focus({preventScroll:true})`);}finally{await h.close();save('visual',out);}}
