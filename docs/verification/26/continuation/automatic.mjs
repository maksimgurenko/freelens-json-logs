import {connect,save,assert,tick} from './host.mjs';
const h=await connect(),out={host:'Freelens 1.10.3',version:'0.1.24',input:'Playwright trusted mouse/keyboard; actual selection and real owned log requests'};let saved=false;
try{
 await h.send('Page.bringToFront');await h.clipboardSave();saved=true;
 await h.run(`(async()=>{const p=global.__cv26;await p.close();await p.display();await p.input('Inspection','side');await p.click('Readable');await p.display(false);p.scroll();})()`);
 if(await h.run("!!global.__cv26.button('Resume')"))await h.clickLabel('Resume');
 await h.run(`(async()=>{const p=global.__cv26;for(let i=0;i<200&&(p.state().refreshing||p.state().waiting);i++)await p.tick(10);p.scroll();p.readsBeforeGesture=p.requests.length;p.inspectedOriginal=p.state().snapshot.records[14].transportLine;})()`);
 await h.click(await h.rowPoint(14));assert(await h.selected()==='14','Automatic view did not inspect');await h.run('global.__cv26.scroll()');
 await h.drag(await h.rowPoint(6,'message',.05),await h.rowPoint(8,'message',.9));out.selection=await h.run('getSelection().toString()');assert(out.selection.includes('row 0008'),'Automatic view has no real drag selection');
 await tick(3300);
 out.automatic=await h.run(`(()=>{const p=global.__cv26;return {paused:p.state().paused,additionalLogRequests:p.requests.length-p.readsBeforeGesture,selected:p.selected(),originalRetained:p.state().snapshot.records[14].transportLine===p.inspectedOriginal,requests:p.requests.slice(p.readsBeforeGesture).map(p.summary)};})()`);
 assert(!out.automatic.paused&&out.automatic.additionalLogRequests>0&&out.automatic.selected==='14'&&out.automatic.originalRetained,'Selection/inspection paused updates or lost identity');
 await h.key('c','KeyC',67,2);out.copyAfterRefresh=await h.run(`require('electron').clipboard.readText()===getSelection().toString()&&getSelection().toString().length>0`);assert(out.copyAfterRefresh,'Selection copy after real refresh differs');
 await h.clickLabel('Pause');out.pausedExplicitly=await h.run('global.__cv26.state().paused');assert(out.pausedExplicitly,'Pause failed');out.passed=true;
}finally{if(saved)out.clipboardRestored=await h.clipboardRestore();await h.close();save('automatic',out);}
