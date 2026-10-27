// Installed packed viewer on real Kubernetes logs. DOM event transactions only;
// no native keyboard, clipboard, window focus or fabricated document focus.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { driver, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { evidence } from './config.mjs';
const d=await driver(),result={session:privateSession(),inputLayer:'DOM events/Range only; native delivery unverified'};
try{
 await d.bind(d.cluster());
 const fixture=JSON.parse(readFileSync(`${evidence}/fixture.json`));
 const clusterId=await d.page.evaluate('global.LensExtensions.Renderer.Catalog.getActiveCluster().id',d.cluster());
 await d.page.evaluate("global.LensExtensions.Renderer.Navigation.navigate('/overview');true",d.cluster());await d.wait(s=>!s.live&&!s.service.owners);
 await d.page.evaluate(`global.__findRenderer.navigate('readable-logs',${JSON.stringify({namespace:fixture.namespace,pod:'find-fixtures',podUid:fixture.podUid,clusterId})});true`,d.cluster());
 for(let i=0;i<300;i++){if(await d.page.evaluate('document.querySelectorAll(".rl-record").length===120&&!document.querySelector(".rl-records[aria-busy=true]")',d.cluster()))break;assert(i<299,'Initial real snapshot unavailable');await sleep(20);}
 result.state=await d.page.evaluate(`(async()=>{
 const root=document.querySelector('.readable-logs'),checks=globalThis.__find48StateChecks=[];
 const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label)},rows=()=>[...root.querySelectorAll('.rl-record')],input=()=>root.querySelector('#rl-find');
 const b=n=>{const x=[...root.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')===n||x.textContent.trim()===n);if(!x)throw Error('Missing '+n);x.click()};
 const active=()=>Number(root.querySelector('.rl-find-current')?.dataset.recordIndex??-1),count=()=>root.querySelector('.rl-find-count').textContent;
 const wait=async f=>{for(let i=0;i<300;i++){if(f())return;await new Promise(r=>setTimeout(r,15))}throw Error('State not settled: '+count())};
 const edit=(text,type='insertText',start=input().value.length,end=start)=>{input().setSelectionRange(start,end);input().dispatchEvent(new InputEvent('beforeinput',{bubbles:true,inputType:type,data:text}));Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input(),text);input().dispatchEvent(new InputEvent('input',{bubbles:true,inputType:type,data:text}));};
 const query=async(text,type,start,end)=>{edit(text,type,start,end);await wait(()=>text ? /matching records/.test(count()) : count()==='Enter text to find');};
 b('Pause');check(root.querySelector('.rl-update-status').textContent==='Paused','Fixture paused after complete actual snapshot');b('Find');
 await query('upstream');check(active()===2&&count()==='1 of 4 matching records','D03 initial query includes first retained hit');
 for(const mode of ['Match case','Whole words']){b(mode);await wait(()=>count()==='1 of 4 matching records');check(active()===2&&root.querySelector('[aria-label="'+mode+'"]').getAttribute('aria-pressed')==='true','D10 stable initial '+mode+' refines and retains candidate');}
 b('Next match');check(active()===73,'D10 explicit Next after flags uses current matching list');b('Match case');await wait(()=>count()==='2 of 4 matching records');check(active()===73,'D10 mode refinement preserves later matching candidate');
 await query('UPSTREAM','insertFromPaste',0,input().value.length);check(count()==='1 of 4 matching records','D10 folded query ready');b('Match case');await wait(()=>count()==='0 of 0 matching records');check(active()===-1,'D10 Match case exact characters excludes uppercase query');b('Match case');await wait(()=>count()==='1 of 4 matching records');check(active()===2,'D10 restoring mode restores candidate');
 b('Clear Find');await query('up');check(count()==='0 of 0 matching records','D10 Whole words excludes partial word');b('Whole words');await wait(()=>count()==='1 of 4 matching records');check(active()===2,'D10 Whole words off searches partial literal');
 rows()[64].querySelector('.rl-row').click();rows()[64].querySelector('.rl-row').click();check(active()===-1&&count()==='0 of 4 matching records','D03 deselection leaves ready data without anchor or active hit');b('Previous match');check(active()===90&&count()==='4 of 4 matching records','D03 initial Previous starts at last match');
 b('Clear Find');await query('upstream');b('Next match');b('Next match');check(active()===82,'D06 transaction fixture at later candidate');
 await query('upstreamx','insertFromPaste',8,8);check(active()===-1,'D06 partial paste refines to zero');await query('upstream','historyUndo');check(active()===82,'D06 Undo refinement restores latest candidate');await query('upstreamx','historyRedo');check(active()===-1,'D06 Redo refinement returns to zero');await query('upstream','historyUndo');
 input().setSelectionRange(0,input().value.length);input().dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));edit('upstream','insertCompositionText',0,8);check(root.querySelector('[aria-label="Next match"]').disabled,'D06 composing input disables navigation');input().dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Enter',isComposing:true}));input().dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'upstream'}));await wait(()=>count()==='1 of 4 matching records');check(active()===2,'D06 select-all DOM composition commits one new search');
 await query('','deleteByCut',0,8);check(input().value===''&&active()===-1,'D06 cut to empty ends sequence');await query('upstream','historyUndo');check(active()===2,'D06 undo crossing empty starts from beginning');
 const scroller=root.querySelector('.rl-records');scroller.scrollTop=500;scroller.dispatchEvent(new Event('scroll'));const top=scroller.scrollTop;b('Clear Find');check(scroller.scrollTop===top,'D09 Clear has no scroll');await query('no-such-record');check(count()==='0 of 0 matching records'&&scroller.scrollTop===top,'D09 zero-hit search has no scroll');
 b('Close Find');b('Find');b('Search history');check([...root.querySelectorAll('.rl-history-text')].some(x=>x.textContent==='no-such-record'),'D16 completed zero-hit query committed on Close');b('Close search history');b('Clear Find');await query('row 2 upstream');b('Next match');check(count()==='1 of 1 matching records'&&root.textContent.includes('Only matching record'),'D09 one-hit navigation feedback');
 b('Match case');await wait(()=>count()==='1 of 1 matching records');b('Next match');b('Clear Find');await query('upstream');b('Search history');const entry=[...root.querySelectorAll('.rl-history-text')].find(x=>x.textContent==='row 2 upstream');check(!!entry,'D16 explicit navigation commits exact tuple');entry.closest('button').click();await wait(()=>count()==='1 of 1 matching records');check(input().value==='row 2 upstream'&&root.querySelector('[aria-label="Match case"]').getAttribute('aria-pressed')==='true'&&!root.querySelector('.rl-history-popover'),'D10/D16 history recall restores text and flags as new search');
 // Dispatch invalid seeds through the actual selection-before-focus boundary.
 const seed=async(element,expected,label)=>{b('Clear Find');b('Close Find');element.focus?.({preventScroll:true});const r=document.createRange();r.selectNodeContents(element);getSelection().removeAllRanges();getSelection().addRange(r);b('Find');check(input().value===expected,label);getSelection().removeAllRanges();if(expected)await wait(()=>/matching records/.test(count()));};
 await seed(rows()[2].querySelector('.rl-message'),'row 2 upstream','D12 message Range seeds exact application content');
 b('Close Find');const other=document.createRange();other.selectNodeContents(rows()[11].querySelector('.rl-message'));getSelection().removeAllRanges();getSelection().addRange(other);b('Find');check(input().value==='row 2 upstream','D12 existing query survives different source selection');getSelection().removeAllRanges();
 await seed(root.querySelector('.rl-toolbar button'),'','D12 generated control selection ignored');
 b('Clear Find');b('Close Find');const multi=document.createRange();multi.setStart(rows()[2].querySelector('.rl-message').firstChild,0);multi.setEndAfter(rows()[3].querySelector('.rl-message'));getSelection().removeAllRanges();getSelection().addRange(multi);b('Find');check(input().value==='','D12 multi-record selection ignored');getSelection().removeAllRanges();
 // An edit is immediately pending before async SDK delivery. Dismissal cancels
 // intent while useful exact data can complete; this is not a held worker reply.
 rows()[64].querySelector('.rl-row').click();edit('upstream');b('Close record inspector');await wait(()=>count()==='0 of 4 matching records');check(active()===-1&&!root.querySelector('.rl-detail'),'D14 current completion after inspector dismissal cannot resurrect selection');
 edit('payment');b('Clear Find');await new Promise(r=>setTimeout(r,150));check(input().value===''&&active()===-1,'D11 Clear during async dispatch rejects obsolete result');
 return{checks,count:count(),paused:root.querySelector('.rl-update-status').textContent};})()`,d.cluster());
 result.pass=true;
}catch(error){result.error=error.stack;process.exitCode=1;}finally{result.completedChecks=await d.page.evaluate('globalThis.__find48StateChecks',d.cluster()).catch(()=>[]);await d.page.evaluate("global.LensExtensions.Renderer.Navigation.navigate('/overview');true",d.cluster()).catch(()=>{});result.closed=await d.wait(s=>!s.live&&!s.service.owners).catch(()=>null);report('state-acceptance',result);console.log(JSON.stringify({pass:result.pass,error:result.error,checks:result.state?.checks.length??result.completedChecks?.length}));d.close()}
