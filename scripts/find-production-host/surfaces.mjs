// Public installed renderer/SDK seam. Real Kubernetes inputs, DOM Ranges/events
// and CSS-only size/font probes; no native input, clipboard or fabricated focus.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { driver, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { evidence } from './config.mjs';

const d = await driver(), result = { session: privateSession(),
  scope: 'Installed renderer and actual SDK/worker; DOM selection/geometry only. Private diagnostic compositor, native/platform unverified.' };
try {
  await d.bind(d.cluster());
  const fixture = JSON.parse(readFileSync(`${evidence}/surface-fixture.json`));
  const clusterId = await d.page.evaluate('LensExtensions.Renderer.Catalog.getActiveCluster().id', d.cluster());
  await d.page.evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');true", d.cluster());
  await d.wait(s => !s.live && !s.service.owners);
  await d.page.evaluate(`__findRenderer.navigate('readable-logs',${JSON.stringify({ namespace: fixture.namespace, pod: fixture.pod, podUid: fixture.podUid, clusterId })});true`, d.cluster());
  for (let i = 0; i < 300; i++) {
    if (await d.page.evaluate('document.querySelectorAll(".rl-record").length===180', d.cluster())) break;
    assert(i < 299, 'Initial surface snapshot unavailable'); await sleep(20);
  }
  result.surfaces = await d.page.evaluate(`(async()=>{
    const root=document.querySelector('.readable-logs'), checks=globalThis.__find48SurfaceChecks=[];
    const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label)};
    const rows=()=>[...root.querySelectorAll('.rl-record')],input=()=>root.querySelector('#rl-find');
    const button=name=>{const b=[...root.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===name||b.textContent.trim()===name);if(!b||b.disabled)throw Error('Missing enabled '+name);b.click()};
    const until=async(test,label)=>{for(let i=0;i<350;i++){if(test())return;await new Promise(r=>setTimeout(r,10))}throw Error(label)};
    const frames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const count=()=>root.querySelector('.rl-find-count')?.textContent,active=()=>Number(root.querySelector('.rl-find-current')?.dataset.recordIndex??-1);
    const query=async text=>{const e=input();e.setSelectionRange(0,e.value.length);e.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,inputType:'insertFromPaste',data:text}));Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,text);e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste',data:text}));await until(()=>count()?.includes('matching records'),'Matching not ready');await frames()};
    const display=name=>{root.querySelector('.rl-display-options').open=true;button(name);root.querySelector('.rl-display-options').open=false};
    const layout=async value=>{const e=root.querySelector('select[aria-label="Inspection"]');e.value=value;e.dispatchEvent(new Event('change',{bubbles:true}));await frames()};
    const closeInspector=()=>root.querySelector('[aria-label="Close record inspector"]')?.click();
    const seed=async(element,text,expected,label)=>{
      if(input().value)button('Clear Find');button('Close Find');
      const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT),nodes=[];let n;while(n=walker.nextNode())nodes.push(n);
      const content=element.textContent,start=content.indexOf(text);check(start>=0,'Seed source contains '+label);
      const point=offset=>{let at=0;for(const node of nodes){if(at+node.length>=offset)return[node,offset-at];at+=node.length}throw Error('Seed offset outside source')};
      const r=document.createRange();r.setStart(...point(start));r.setEnd(...point(start+text.length));getSelection().removeAllRanges();getSelection().addRange(r);
      check(getSelection().toString()===text,'Exact DOM Range for '+label);button('Find');
      check(input().value===expected,label);getSelection().removeAllRanges();if(expected)await until(()=>count()?.includes('matching records'),'Seed evaluation not ready');
    };
    button('Pause');button('Find');
    await seed(rows()[160].querySelector('.rl-message'),'😀'.repeat(256),'😀'.repeat(256),'D12 256 astral code points seed despite 512 UTF-16 units');
    await seed(rows()[160].querySelector('.rl-message'),'😀'.repeat(257),'','D12 257 astral code points rejected');
    for(const separator of ['\\n','\\r','\\u2028','\\u2029'])await seed(rows()[161].querySelector('.rl-message'),separator,'','D12 line separator U+'+separator.codePointAt(0).toString(16)+' rejected');
    // The selected source may live outside the viewer even within the same frame.
    const foreignSource=document.createElement('span');foreignSource.textContent='foreign needle';root.parentElement.append(foreignSource);
    try{const foreign=document.createRange();foreign.selectNodeContents(foreignSource);button('Close Find');getSelection().removeAllRanges();getSelection().addRange(foreign);button('Find');check(input().value==='','D12 short foreign surface selection ignored')}finally{getSelection().removeAllRanges();foreignSource.remove()}
    rows()[162].querySelector('.rl-row').click();
    for(const mode of ['inline','side','bottom']){
      await layout(mode);
      for(const [tab,text,expected] of [['Application text','message','message'],['Transport line','message','message'],['Extracted message','Σ decoded','Σ decoded'],['All fields','needle','needle'],['All fields','Σ needle',''],['All fields','  ','']]){
        button(tab);await seed(root.querySelector('.rl-detail pre'),text,expected,'D12 '+mode+' '+tab+' '+JSON.stringify(text)+' provenance');
      }
    }
    closeInspector();await layout('side');
    const scroller=root.querySelector('.rl-records'),marks=()=>[...root.querySelectorAll('.rl-find-mark')];
    const population=()=>marks().reduce((sum,b)=>sum+Number(/Find (\\d+) matching records/.exec(b.getAttribute('aria-label'))?.[1]??1),0);
    const markFor=ordinal=>marks().find(b=>{const label=b.getAttribute('aria-label'),group=/Find (\\d+) matching records, starting at (\\d+)/.exec(label);return group?ordinal>=Number(group[2])&&ordinal<Number(group[2])+Number(group[1]):label==='Find matching record '+ordinal+' of 4'});
    const wrap=[...root.querySelectorAll('.rl-display-panel label')].find(l=>l.textContent.includes('Word wrap')).querySelector('input');
    if(!wrap.checked)wrap.click();await query('needle');
    const measurements=[];
    const geometry=async label=>{
      await frames();await until(()=>population()===4,'Geometry lost complete matching population');
      await until(()=>[[1,0],[2,64],[3,120],[4,162]].every(([ordinal,index])=>{
        const mark=markFor(ordinal);if(!mark)return false;
        const top=scroller.getBoundingClientRect().top+scroller.clientTop;
        const projected=(rows()[index].getBoundingClientRect().top-top+scroller.scrollTop)/scroller.scrollHeight*scroller.clientHeight;
        return Math.abs(parseFloat(mark.style.top)-projected)<=14;
      }),label+' geometry did not settle after layout/observer commits');
      const top=scroller.getBoundingClientRect().top+scroller.clientTop;
      const sample={label,width:root.getBoundingClientRect().width,height:scroller.clientHeight,scrollHeight:scroller.scrollHeight,marks:[]};
      for(const [ordinal,index] of [[1,0],[2,64],[3,120],[4,162]]){
        const b=markFor(ordinal);check(!!b,label+' mark includes '+index);
        const coordinate=rows()[index].getBoundingClientRect().top-top+scroller.scrollTop;
        const projected=coordinate/scroller.scrollHeight*scroller.clientHeight,actual=parseFloat(b.style.top);
        if(Math.abs(actual-projected)>14)throw Error(label+' measured row '+index+': '+JSON.stringify({coordinate,projected,actual,scrollTop:scroller.scrollTop,scrollHeight:scroller.scrollHeight,clientHeight:scroller.clientHeight,mark:b.outerHTML}));
        check(true,label+' measured row '+index);sample.marks.push({index,coordinate,projected,actual,label:b.getAttribute('aria-label')});
      }measurements.push(sample);
    };
    await geometry('wrapped');check(rows()[10].getBoundingClientRect().height>100,'Long real source wraps');
    for(const width of [260,390,700,1440]){
      root.style.width=width+'px';await geometry('width '+width);
      check(root.scrollWidth<=width,'Viewer has no horizontal page overflow at '+width);
      check(getComputedStyle(scroller).backgroundColor==='rgb(0, 0, 0)'&&!root.querySelector('.rl-line-number'),'Black/no-counter appearance at '+width);
      check(root.querySelector('.rl-findbar').parentElement===root&&root.querySelector('.rl-toolbar').parentElement===root,'Separate compact toolbar/Find at '+width);
      check(marks().every(b=>b.tagName==='BUTTON'&&b.type==='button'&&b.getAttribute('aria-label')&&parseFloat(b.style.top)+7<=scroller.clientHeight),'Accessible bounded rail at '+width);
    }
    root.style.width='700px';await layout('inline');rows()[10].querySelector('.rl-row').click();await geometry('expanded inline');
    const inspected=root.querySelector('.rl-selected');markFor(3).click();await frames();
    check(active()===120&&root.querySelector('.rl-selected')===inspected&&root.querySelector('.rl-update-status').textContent==='Paused','Mark preserves independent inspector and Pause');
    check(document.activeElement===input(),'Mark focuses Find input');
    button('Clear Find');await query('needle');check(active()===64,'Mark does not replace independent reading row');
    closeInspector();await geometry('closed inline');rows()[64].querySelector('.rl-match-hint').click();await geometry('hidden original inspector');
    check(root.querySelector('.rl-detail pre').textContent==='{"message": "visible", "secret": "needle"}','Hidden source exact Application text');closeInspector();
    display('Raw');await geometry('Raw');display('Readable');await geometry('Readable');
    // New FontFace from already available system-independent local data. It is
    // a CSS probe, not a change to host fonts or a claim about OS font delivery.
    const face=new FontFace('Find48Geometry','local("DejaVu Sans Mono")');document.fonts.add(face);scroller.style.fontFamily='Find48Geometry, monospace';
    try{await face.load();await document.fonts.ready;await geometry('font readiness')}finally{document.fonts.delete(face);scroller.style.fontFamily=''}
    const live=markFor(3);rows()[10].style.minHeight='12000px';live.click();await frames();
    const offset=rows()[120].getBoundingClientRect().top-scroller.getBoundingClientRect().top-scroller.clientTop;
    check(active()===120&&Math.abs(offset)<=1,'Live reveal resolves current geometry before queued observer');rows()[10].style.minHeight='';await geometry('growth restored');
    // Selection and source nodes survive geometry-only presentation changes.
    const source=rows()[120].querySelector('.rl-message'),r=document.createRange();r.selectNodeContents(source);getSelection().removeAllRanges();getSelection().addRange(r);
    root.style.width='390px';await frames();check(getSelection().toString()==='needle 120'&&rows()[120].querySelector('.rl-message')===source,'Resize preserves exact DOM selection/source node');getSelection().removeAllRanges();
    await layout('side');if(wrap.checked)wrap.click();root.style.width='';
    return{checks,measurements,documentHasFocus:document.hasFocus(),paused:root.querySelector('.rl-update-status').textContent};
  })()`, d.cluster());
  result.pass = true;
} catch (error) { result.error = error.stack; process.exitCode = 1; }
finally {
  result.completedChecks = await d.page.evaluate('globalThis.__find48SurfaceChecks', d.cluster()).catch(() => []);
  await d.page.evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');true", d.cluster()).catch(() => {});
  result.closed = await d.wait(s => !s.live && !s.service.owners && !s.service.retiring).catch(() => null);
  report('surfaces', result); console.log(JSON.stringify({ pass: result.pass, error: result.error, checks: result.completedChecks.length })); d.close();
}
