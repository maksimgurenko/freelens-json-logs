/* THROWAWAY. Three structural variants of Readable logs; all changes are in memory.
 * This browser fixture reuses the production canvas styling, not Electron APIs.
 * Question: which arrangement gives logs space while keeping controls findable?
 */
const icons = {
  left:'<path d="m10 4-6 4 6 4"/>',right:'<path d="m6 4 6 4-6 4"/>',up:'<path d="m4 10 4-4 4 4"/>',down:'<path d="m4 6 4 4 4-4"/>',
  close:'<path d="m4 4 8 8M12 4l-8 8"/>',search:'<circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/>',
  pause:'<path d="M5 3v10M11 3v10"/>',play:'<path d="m5 3 8 5-8 5z"/>',refresh:'<path d="M13 6a5.3 5.3 0 1 0 .1 4M13 2v4H9"/>',
  settings:'<path d="M3 4h10M3 8h10M3 12h10"/><path d="M6 2v4M10 6v4M6 10v4"/>',
  profile:'<rect x="3" y="2" width="10" height="12" rx="1"/><path d="M6 5h4M6 8h4M6 11h2"/>',
  bottom:'<path d="M3 13h10M8 2v8m-3-3 3 3 3-3"/>',wrap:'<path d="M2 4h12M2 8h9a2.5 2.5 0 0 1 0 5H8m2-2-2 2 2 2M2 12h3"/>',
  raw:'<path d="m5 4-4 4 4 4m6-8 4 4-4 4M9 2 7 14"/>',clock:'<circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/>',
  info:'<circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 4v.1"/>',check:'<path d="m3 8 3 3 7-7"/>',panel:'<rect x="2" y="2" width="12" height="12" rx="1"/><path d="M10 2v12"/>',
};
const icon = name => `<svg viewBox="0 0 16 16" aria-hidden="true">${icons[name] || icons.info}</svg>`;
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const variants = {
  a:{name:'Compact bands',summary:'Context above · Find always within reach'},
  b:{name:'Single toolbar',summary:'One row · Find opens only when requested'},
  c:{name:'Vertical rail',summary:'Tools at the side · Find floats over logs'},
};
const params = new URLSearchParams(location.search);
const state = {
  variant:variants[params.get('variant')] ? params.get('variant') : 'a',
  view:'logs', find:false, query:'', match:-1, paused:false, raw:false, timestamps:true, wrap:false,
  selected:-1, content:'fields', layout:'side', menu:false, about:false,
  container:'json', profile:'auto', profileSelected:'production', editing:false, draft:null,
  saved:{name:'Production JSON',message:'/message\n/msg',level:'/level\n/severity'}, globalDefault:'default',
  notice:'', copied:'', longNames:false, empty:false, error:false, count:160,
};
history.replaceState({prototype:true,view:'logs'},'',location.href);
const app = document.querySelector('#app');
const announcer = document.querySelector('#announcer');
const sourceMessages = [
  ['INFO','changing JSON fixture',{sequence:1,interval:3}],
  ['INFO','GET /api/v1/orders completed',{method:'GET',path:'/api/v1/orders',status:200,duration_ms:24,request_id:'req-81f2'}],
  ['DEBUG','Cache hit for customer preferences',{customer_id:'cus_0281',cache_key:'preferences:0281',ttl_seconds:300}],
  ['INFO','Worker claimed job',{job_id:'job_a93f',queue:'notifications',attempt:1}],
  ['WARN','Upstream request exceeded latency threshold',{service:'inventory',duration_ms:824,threshold_ms:500}],
  ['INFO','Connection pool ready',{active:8,idle:12,max:20}],
  ['INFO','Published order.created event',{order_id:'ord_4372',topic:'orders',partition:2}],
  ['ERROR','Unable to reach payment gateway; retry scheduled',{error:'ECONNREFUSED',upstream:'payments:8443',attempt:2,retry_ms:1000}],
  ['INFO','GET /healthz completed',{status:200,duration_ms:1}],
  ['DEBUG','Loaded formatting configuration',{namespace:'readable-logs-spike',revision:12}],
  ['INFO','changing JSON fixture',{sequence:11,interval:3}],
  ['INFO','Processed notification batch',{batch_size:24,elapsed_ms:91}],
  ['WARN','Queue depth above target',{queue:'notifications',depth:182,target:100}],
  ['INFO','Background sync complete',{items_updated:38,items_unchanged:102,duration_ms:247}],
  ['INFO','GET /api/v1/orders completed',{status:200,duration_ms:31,request_id:'req-c614'}],
  ['INFO','Record retains every original field, even when the compact row shows only its message',{context:{region:'eu-west-1',version:'2.4.1'},trace_id:'864b32db77c34129a1a028afa8c0bb42'}],
];
function records() {
  return Array.from({length:state.count},(_,i)=>{
    const [level,message,extra]=sourceMessages[i % sourceMessages.length];
    const date=new Date(Date.UTC(2026,9,24,18,22,45+i*3));
    const application={timestamp:date.toISOString(),level,message,...extra,sequence:i+1};
    const text=JSON.stringify(application);
    return {i,level,message,application,text,transport:`${date.toISOString()} ${text}`,time:date.toISOString().slice(11,19),fields:Object.keys(extra).length+1};
  });
}
let data=records();
const matches=()=> state.query ? data.filter(r=>r.text.toLowerCase().includes(state.query.toLowerCase())).map(r=>r.i) : [];
function button(action,label,ico,extra='') { return `<button type="button" data-action="${action}" ${extra}>${ico?icon(ico):''}${label?esc(label):''}</button>`; }
function tool(action,label,ico,extra='') { return button(action,'',ico,`${extra.includes('class=')?'':'class="quiet icon"'} aria-label="${esc(label)}" title="${esc(label)}" ${extra}`); }
function context() {
  const pod=state.longNames?'orders-api-production-eu-west-1-7fc98d6b58-vj4q2':'changing-logs';
  return `<div class="breadcrumbs" title="kind-freelens-json-logs-spike / readable-logs-spike / ${pod}"><span class="cluster-name">kind-freelens-json-logs-spike</span>${icon('right')}<span>readable-logs-spike</span>${icon('right')}<strong>${pod}</strong></div>`;
}
function containerSelect(label=true) {
  return `<label class="compact-select">${label?'<span>Container</span>':''}<select data-input="container" aria-label="Container" title="Selected container"><option value="json" ${state.container==='json'?'selected':''}>json</option><option value="mixed" ${state.container==='mixed'?'selected':''}>mixed</option><option value="worker" ${state.container==='worker'?'selected':''}>notification-worker</option></select></label>`;
}
function profileSelect(label=true) {
  return `<label class="compact-select">${label?'<span>Profile</span>':''}<select data-input="profile" aria-label="Profile" title="Formatting profile"><option value="auto" ${state.profile==='auto'?'selected':''}>Auto · ${state.globalDefault==='default'?'Default':esc(state.saved.name)}</option><option value="default" ${state.profile==='default'?'selected':''}>Default</option><option value="production" ${state.profile==='production'?'selected':''}>${esc(state.longNames?'Production JSON · Order processing':state.saved.name)}</option></select></label>`;
}
function findInput() {
  const found=matches(), ordinal=found.indexOf(state.match)+1;
  return `<div class="compact-find"><input type="search" data-input="find" aria-label="Find in logs" placeholder="Find in logs…" value="${esc(state.query)}"><span class="count" role="status">${state.query?`${ordinal}/${found.length}`:''}</span>${tool('previous-match','Previous match · Shift+Enter','up',!found.length?'disabled':'')}${tool('next-match','Next match · Enter','down',!found.length?'disabled':'')}</div>`;
}
function pause(label=true) { return button('pause',label?(state.paused?'Resume':'Pause'):'',state.paused?'play':'pause',`${label?'':'class="quiet icon"'} aria-label="${state.paused?'Resume':'Pause'} automatic updates" title="${state.paused?'Resume':'Pause'} automatic updates" aria-pressed="${state.paused}"`); }
function variantA() {
  return `<div class="contextbar"><span class="view-title">Readable logs</span>${context()}${tool('identity','Target details','info','class="quiet icon push"')}</div>
    <div class="toolbar"><div class="controls-group">${containerSelect()}${profileSelect()}${button('profiles','Profiles')}</div>
    <div class="find-shell">${icon('search')}${findInput()}</div><div class="controls-group push">${pause()}${tool('refresh','Refresh snapshot','refresh')}${tool('view-options','Display options','settings')}</div></div>`;
}
function variantB() {
  const pod=state.longNames?'orders-api-production-eu-west-1-7fc98d6b58-vj4q2':'changing-logs';
  return `<div class="toolbar single-toolbar"><div class="breadcrumbs" title="kind-freelens-json-logs-spike / readable-logs-spike / ${pod}"><span>readable-logs-spike</span>${icon('right')}<strong>${pod}</strong></div>
    <div class="controls-group">${containerSelect(false)}${profileSelect(false)}${tool('profiles','Profiles · edit formatting rules','profile')}</div>
    <div class="controls-group push">${button('find','Find','search','title="Find in logs · Ctrl+F / ⌘F"')}${pause()}${tool('refresh','Refresh snapshot','refresh')}${tool('view-options','Display options','settings')}${tool('identity','Target details','info')}</div></div>
    ${state.find?`<div class="findbar">${findInput()}<span class="muted">Application text or message</span>${tool('close-find','Close Find · Escape','close')}</div>`:''}`;
}
function variantC() {
  return `<div class="contextbar">${context()}<div class="push controls-group">${containerSelect()}${profileSelect()}</div></div>`;
}
function rail() {
  return `<nav class="rail" aria-label="Log tools">${tool('find','Find · Ctrl+F / ⌘F','search',`aria-pressed="${state.find}"`)}${tool('profiles','Formatting profiles','profile')}<div class="rail-divider"></div>${pause(false)}${tool('refresh','Refresh snapshot','refresh')}<div class="rail-divider"></div>${tool('raw','Toggle Raw presentation','raw',`aria-pressed="${state.raw}"`)}${tool('wrap','Toggle word wrap','wrap',`aria-pressed="${state.wrap}"`)}${tool('timestamps','Toggle timestamps','clock',`aria-pressed="${state.timestamps}"`)}${tool('view-options','Display and inspection options','settings')}<span class="rail-bottom"></span>${tool('identity','Target details','info')}</nav>`;
}
function highlight(text) {
  if(!state.query) return esc(text);
  const lower=text.toLowerCase(), needle=state.query.toLowerCase(); let out='',last=0,at;
  while((at=lower.indexOf(needle,last))>=0) { out+=esc(text.slice(last,at))+'<mark>'+esc(text.slice(at,at+needle.length))+'</mark>';last=at+needle.length; }
  return out+esc(text.slice(last));
}
function rows() {
  return data.map(r=>`<div class="rl-record${state.selected===r.i?' rl-selected':''}${state.match===r.i?' rl-find-current':''}" data-record="${r.i}">
    <div class="rl-row" role="button" tabindex="0" data-action="select-record" data-record="${r.i}" aria-label="Inspect record ${r.i+1}: ${esc(r.message)}" aria-pressed="${state.selected===r.i}">
    ${state.raw?`<span class="rl-message">${highlight(state.timestamps?r.transport:r.text)}</span>`:`${state.timestamps?`<time datetime="${r.application.timestamp}">10/24/2026, ${r.time}</time>`:''}<span class="rl-level rl-severity-${r.level.toLowerCase()}">${r.level}</span><span class="rl-message">${highlight(r.message)}</span><span class="rl-fields">${r.fields} fields</span>`}</div>
    ${state.selected===r.i&&state.layout==='inline'?`<div class="inline-detail">${inspector()}</div>`:''}</div>`).join('');
}
function inspector() {
  const r=data[state.selected]; if(!r)return '';
  const body=state.content==='fields'?JSON.stringify(r.application,null,2):state.content==='application'?r.text:r.transport;
  return `<section class="rl-detail" aria-label="Selected record"><header class="rl-detail-head"><strong>Record ${r.i+1}</strong>${tool('close-inspector','Close record inspector · Escape','close')}</header><div class="rl-detail-tabs" role="group" aria-label="Record content">
    ${[['fields','All fields'],['application','Application text'],['transport','Transport line']].map(([v,label])=>button('record-content',label,null,`data-content="${v}" aria-pressed="${state.content===v}"`)).join('')}</div>
    <div class="rl-detail-body"><p>${state.content==='fields'?'Complete parsed object, including compactly hidden fields.':state.content==='application'?'Exact application text, without the Kubernetes timestamp.':'Exact received line, including the Kubernetes timestamp.'}</p><pre>${esc(body)}</pre></div>
    <footer class="rl-copy">${button('copy-application','Copy application text')}${button('copy-transport','Copy transport line')}<span role="status">${esc(state.copied)}</span></footer></section>`;
}
function options() {
  return `<section class="popup" aria-label="Display options">${tool('close-menu','Close options','close','class="quiet icon popup-close"')}<h2>Display options</h2>
    <label>Presentation <select data-input="raw" aria-label="Presentation"><option value="false" ${!state.raw?'selected':''}>Readable</option><option value="true" ${state.raw?'selected':''}>Raw</option></select></label>
    <label><span>Show timestamps</span><input type="checkbox" data-input="timestamps" ${state.timestamps?'checked':''}></label>
    <label><span>Word wrap</span><input type="checkbox" data-input="wrap" ${state.wrap?'checked':''}></label><hr>
    <label>Inspection <select data-input="layout" aria-label="Inspection layout"><option value="side" ${state.layout==='side'?'selected':''}>Side</option><option value="bottom" ${state.layout==='bottom'?'selected':''}>Bottom</option><option value="inline" ${state.layout==='inline'?'selected':''}>Inline</option></select></label>
    <p class="hint">The inspector opens when you select a record. Closing it gives that space back to the logs.</p>
    <hr><h2>Try a different state</h2><label><span>Long target names</span><input type="checkbox" data-input="longNames" ${state.longNames?'checked':''}></label>
    <label><span>Request error</span><input type="checkbox" data-input="error" ${state.error?'checked':''}></label><label><span>No logs returned</span><input type="checkbox" data-input="empty" ${state.empty?'checked':''}></label></section>`;
}
function identity() {
  return `<section class="popup" aria-label="Target details">${tool('close-menu','Close target details','close','class="quiet icon popup-close"')}<h2>Target details</h2><div class="identity-line">Cluster: kind-freelens-json-logs-spike<br>Namespace: readable-logs-spike<br>Pod: changing-logs<br>Container: ${esc(state.container)}<br>Pod UID: c8190dc0-0f37-4918-9918-53eba7c8ebc1<br>Active profile: ${esc(state.profile==='production'?state.saved.name:'Default')}</div></section>`;
}
function footer() {
  return `<footer class="rl-footer${state.paused?' paused':''}"><span role="status">${state.empty?'0':data.length} records<span class="footer-detail"> · 38.4 KiB retained</span></span>
    <span role="status"><span class="status-dot"></span>${state.paused?'Paused':'Automatic updates'}</span>${button('bottom','To bottom','bottom')}
    ${state.variant==='a'?`<span class="footer-grow"></span><div class="presentation-toggle">${button('readable','Readable',null,`aria-pressed="${!state.raw}"`)}${button('raw','Raw',null,`aria-pressed="${state.raw}"`)}</div>`:'<span class="footer-grow"></span>'}
    <label class="footer-toggles"><input type="checkbox" data-input="timestamps" ${state.timestamps?'checked':''}>Timestamps</label><label class="footer-toggles"><input type="checkbox" data-input="wrap" ${state.wrap?'checked':''}>Wrap</label><span class="footer-detail">v0.1.20</span></footer>`;
}
function renderLogs() {
  return `${({a:variantA,b:variantB,c:variantC})[state.variant]()}
    ${state.error?`<div class="notice" role="alert"><span>Logs are outdated · automatic updates stopped. Unable to reach the API server.</span>${button('retry','Retry',null,'class="push"')}</div>`:''}
    <div class="workspace">${state.variant==='c'?rail():''}<div class="log-content layout-${state.layout}">
    ${state.empty?'<div class="empty-logs" role="status">No logs returned for this container.</div>':`<div class="rl-records${state.wrap?' rl-wrap':''}" tabindex="0" aria-label="Container log records">${rows()}</div>`}
    ${state.selected>=0&&!state.empty&&state.layout!=='inline'?`<aside class="rl-inspector" aria-label="Record inspector">${inspector()}</aside>`:''}
    ${state.variant==='c'&&state.find?`<div class="floating-find"><div class="findbar">${findInput()}${tool('close-find','Close Find · Escape','close')}</div></div>`:''}
    </div>${state.menu==='options'?options():state.menu==='identity'?identity():''}</div>${footer()}`;
}
function renderProfiles() {
  const value=state.draft||(state.profileSelected==='default'?{name:'Default',message:'/message\n/msg',level:'/level\n/severity'}:state.saved);
  const dirty=state.draft && JSON.stringify(state.draft)!==JSON.stringify(state.saved);
  const disabled=state.editing?'':'disabled';
  return `<section class="profiles-page" aria-label="Formatting profiles"><header class="profiles-head">${button('back-to-logs','Back to logs','left','title="Return to logs · Escape · unsaved draft is discarded"')}<h1>Formatting profiles</h1><span class="muted">${dirty?'Unsaved changes · leaving discards this draft':'Changes already saved are kept'}</span></header>
    <div class="profile-body"><aside class="profile-list"><h2>Saved profiles</h2>${button('select-default','Default',null,`aria-pressed="${state.profileSelected==='default'}" ${state.editing?'disabled':''}`)}${button('select-production',state.saved.name,null,`aria-pressed="${state.profileSelected==='production'}" ${state.editing?'disabled':''}`)}
      <h2 class="list-space">Global default</h2><label><span class="sr-only">Global default</span><select data-input="default" aria-label="Global default" ${state.editing?'disabled':''}><option value="default" ${state.globalDefault==='default'?'selected':''}>Default</option><option value="production" ${state.globalDefault==='production'?'selected':''}>${esc(state.saved.name)}</option></select></label><p class="small-help">Saves immediately. Leaving a draft does not undo saved changes.</p></aside>
    <div class="editor-area"><header class="editor-title"><h2>${esc(state.profileSelected==='default'&&!state.editing?'Default':value.name)}</h2>${state.editing?'<span class="draft-chip">Draft</span>':''}<div class="controls-group">${state.editing?'':`${button('duplicate','Duplicate')}${button('edit-profile','Edit',null,state.profileSelected==='default'?'disabled':'')}`}</div></header>
    <div class="editor-grid"><div class="editor-fields"><label>Profile name<input type="text" data-input="draft-name" aria-label="Profile name" value="${esc(value.name)}" ${disabled}></label>
    <label>Message paths<textarea data-input="draft-message" aria-label="Message paths" rows="3" ${disabled}>${esc(value.message)}</textarea><small>First usable path wins. Empty uses application text.</small></label>
    <label>Level paths<textarea data-input="draft-level" aria-label="Level paths" rows="3" ${disabled}>${esc(value.level)}</textarea></label>
    <p class="small-note">${state.editing?'Save applies valid rules to retained records. Escape or Back to logs discards this draft.':'Choose Edit, or duplicate Default to start an independent profile.'}</p></div>
    <div class="sample-preview"><h3>Sample log</h3><pre>${esc(JSON.stringify(data[1].application,null,2))}</pre><h3>Preview</h3><pre id="draft-preview">${esc(preview(value))}</pre><p>The sample and profile changes in this browser prototype are temporary.</p></div></div></div></div>
    <footer class="draft-actions">${state.editing?`${button('save-profile','Save profile','check','class="save-button"')}${button('cancel-draft','Cancel draft')}`:'<span class="muted">Saved rules</span>'}<span role="status" class="muted" id="profile-notice">${esc(state.notice)}</span></footer></section>`;
}
function preview(value) {
  const record=data[1];
  const extract=paths=>paths.split('\n').map(p=>p.trim()).filter(Boolean).map(p=>p.replace(/^\//,'').split('/').reduce((v,k)=>v?.[k],record.application)).find(v=>typeof v==='string'&&v.trim());
  return `${record.time}  ${extract(value.level)||''}  ${extract(value.message)||record.text}`;
}
function renderAbout() {
  document.querySelector('.about-panel')?.remove();
  if(!state.about)return;
  const panel=document.createElement('section'); panel.className='about-panel'; panel.setAttribute('aria-label','About the prototype');
  panel.innerHTML=`<button data-action="close-about" aria-label="Close prototype information">Close</button><h2>Compare the control layouts</h2><p><strong>A · Compact bands</strong> keeps context on its own slim line and Find in the controls row.</p><p><strong>B · Single toolbar</strong> gives the most height to logs. Find opens a temporary row; display settings live in a menu.</p><p><strong>C · Vertical rail</strong> moves tools to the side. Find floats above the logs without moving the first record.</p><h3>Try the interactions</h3><table><tbody><tr><td>Focus Find</td><td>Ctrl+F / ⌘F</td></tr><tr><td>Next / previous result</td><td>Enter / Shift+Enter in Find</td></tr><tr><td>Save profile draft</td><td>Ctrl+S / ⌘S in Profiles</td></tr><tr><td>Close the nearest open surface</td><td>Escape</td></tr><tr><td>Switch variants</td><td>← / → outside fields</td></tr></tbody></table><p>Select a record, try Side/Bottom/Inline, or edit a profile and return without saving. Options also contains long-name, empty and error examples.</p><p class="muted">Throwaway browser prototype. Illustrative logs; no Kubernetes requests or settings writes. Browser history demonstrates Profiles → logs. Native mouse Back delivery and shortcut conflicts inside Freelens still require host validation. Nothing here proves saved preferences across restart.</p>`;
  document.body.append(panel);
}
function render({scrollTo,focus,keepScroll=true}={}) {
  const before=document.querySelector('.rl-records'); const top=before?.scrollTop||0,left=before?.scrollLeft||0;
  app.dataset.variant=state.variant; app.innerHTML=state.view==='profiles'?renderProfiles():renderLogs();
  document.querySelector('#variant').value=state.variant;
  document.querySelector('#variant-summary').textContent=variants[state.variant].summary;
  document.querySelector('[data-action=previous-variant]').innerHTML=icon('left');
  document.querySelector('[data-action=next-variant]').innerHTML=icon('right');
  const scroller=document.querySelector('.rl-records');
  if(scroller&&keepScroll){scroller.scrollTop=top;scroller.scrollLeft=left;}
  if(scrollTo!==undefined) document.querySelector(`.rl-record[data-record="${scrollTo}"]`)?.scrollIntoView({block:'center',inline:'nearest'});
  if(focus) document.querySelector(focus)?.focus();
  renderAbout();
}
function setVariant(value) {
  state.variant=value;state.menu=false;
  const url=new URL(location.href);url.searchParams.set('variant',value);history.replaceState({...history.state},'',url);
  console.info('PROTOTYPE variant state', JSON.stringify({variant:value,layout:state.layout,find:state.find,query:state.query,selected:state.selected,view:state.view,raw:state.raw,timestamps:state.timestamps,wrap:state.wrap,paused:state.paused}));
  announcer.textContent=`Variant ${value.toUpperCase()}: ${variants[value].name}. ${variants[value].summary}.`;
  render();
}
let savedLogScroll=0;
function openProfiles() {
  savedLogScroll=document.querySelector('.rl-records')?.scrollTop||0;
  state.view='profiles';state.menu=false;state.editing=false;state.draft=null;state.notice='';state.profileSelected='production';
  history.pushState({prototype:true,view:'profiles'},'',location.href);
  render({focus:'[data-action=back-to-logs]'});
}
function leaveProfiles() {
  const hadDraft=!!state.draft;state.view='logs';state.draft=null;state.editing=false;state.notice='';
  render({focus:'[data-action=profiles]'});
  const scroll=document.querySelector('.rl-records');if(scroll)scroll.scrollTop=savedLogScroll;
  if(hadDraft)announcer.textContent='Unsaved draft discarded. Changes already saved are kept.';
}
window.addEventListener('popstate',()=>{
  if(history.state?.view==='profiles'){state.view='profiles';state.editing=false;state.draft=null;render();}
  else if(state.view==='profiles')leaveProfiles();
});
function closeProfiles() { if(history.state?.view==='profiles') history.back();else leaveProfiles(); }
function find() { state.find=true;state.menu=false;render({focus:'[data-input=find]'});document.querySelector('[data-input=find]')?.select(); }
function moveMatch(direction) {const found=matches();if(!found.length)return;const old=found.indexOf(state.match);state.match=found[(old+direction+found.length)%found.length];render({scrollTo:state.match,focus:'[data-input=find]'});}
async function action(name,el) {
  switch(name) {
    case 'previous-variant':case 'next-variant':{const keys=Object.keys(variants),i=keys.indexOf(state.variant);setVariant(keys[(i+(name==='next-variant'?1:2))%3]);return;}
    case 'about':state.about=!state.about;renderAbout();return;
    case 'close-about':state.about=false;renderAbout();return;
    case 'profiles':openProfiles();return;
    case 'back-to-logs':closeProfiles();return;
    case 'find':find();return;
    case 'close-find':state.find=false;state.query='';state.match=-1;render({focus:'[data-action=find]'});return;
    case 'previous-match':moveMatch(-1);return;
    case 'next-match':moveMatch(1);return;
    case 'pause':state.paused=!state.paused;break;
    case 'refresh':state.count++;data=records();break;
    case 'retry':state.error=false;break;
    case 'raw':state.raw=!state.raw;break;
    case 'readable':state.raw=false;break;
    case 'wrap':state.wrap=!state.wrap;break;
    case 'timestamps':state.timestamps=!state.timestamps;break;
    case 'view-options':state.menu=state.menu==='options'?false:'options';break;
    case 'identity':state.menu=state.menu==='identity'?false:'identity';break;
    case 'close-menu':state.menu=false;break;
    case 'bottom':document.querySelector('.rl-records')?.scrollTo({top:999999});return;
    case 'select-record':state.selected=Number(el.dataset.record);state.copied='';break;
    case 'close-inspector':{const i=state.selected;state.selected=-1;render({focus:`.rl-row[data-record="${i}"]`});return;}
    case 'record-content':state.content=el.dataset.content;state.copied='';break;
    case 'copy-application':case 'copy-transport':{try{await navigator.clipboard.writeText(data[state.selected][name==='copy-application'?'text':'transport']);state.copied='Copied.';}catch{state.copied='Select the text above to copy it.';}break;}
    case 'select-default':state.profileSelected='default';break;
    case 'select-production':state.profileSelected='production';break;
    case 'edit-profile':state.editing=true;state.draft={...state.saved};state.notice='';render({focus:'[data-input=draft-name]'});return;
    case 'duplicate':state.editing=true;state.draft={...state.saved,name:state.profileSelected==='default'?'Default copy':state.saved.name+' copy'};state.profileSelected='production';state.notice='';render({focus:'[data-input=draft-name]'});return;
    case 'save-profile':if(!state.draft?.name.trim()){state.notice='Enter a profile name.';}else{state.saved={...state.draft};state.editing=false;state.draft=null;state.notice='Profile saved for this prototype session.';}break;
    case 'cancel-draft':state.draft=null;state.editing=false;state.notice='Draft discarded. Saved changes are kept.';break;
    default:return;
  }
  const restore=el?.dataset.action;render({focus:restore?`[data-action="${restore}"]`:undefined});
}
document.addEventListener('click',event=>{const el=event.target.closest('[data-action]');if(el&&!el.disabled)void action(el.dataset.action,el);});
document.querySelector('#variant').addEventListener('change',event=>setVariant(event.target.value));
app.addEventListener('input',event=>{
  const el=event.target,key=el.dataset.input;if(!key)return;
  if(key==='find'){
    const start=el.selectionStart;state.query=el.value;state.match=matches()[0]??-1;
    render({scrollTo:state.match>=0?state.match:undefined,focus:'[data-input=find]'});
    const input=document.querySelector('[data-input=find]');try{input.setSelectionRange(start,start);}catch{}
  } else if(key.startsWith('draft-')&&state.draft){
    const property=key.slice(6);state.draft[property]=el.value;
    document.querySelector('#draft-preview').textContent=preview(state.draft);
    document.querySelector('.editor-title h2').textContent=state.draft.name;
    document.querySelector('.profiles-head .muted').textContent='Unsaved changes · leaving discards this draft';
  }
});
app.addEventListener('change',event=>{
  const el=event.target,key=el.dataset.input;if(!key||key==='find'||key.startsWith('draft-'))return;
  if(key==='default'){state.globalDefault=el.value;state.notice='Global default saved for this prototype session.';}
  else if(key==='raw')state.raw=el.value==='true';
  else state[key]=el.type==='checkbox'?el.checked:el.value;
  if(key==='empty')state.selected=-1;
  render({focus:`[data-input="${key}"]`});
});
function escapeLayer() {
  if(state.about){state.about=false;renderAbout();return true;}
  if(state.menu){state.menu=false;render({focus:'[data-action=view-options]'});return true;}
  if(state.view==='profiles'){closeProfiles();return true;}
  if(state.find||state.query){state.find=false;state.query='';state.match=-1;render({focus:state.variant==='a'?'[data-input=find]':'[data-action=find]'});return true;}
  if(state.selected>=0){const i=state.selected;state.selected=-1;render({focus:`.rl-row[data-record="${i}"]`});return true;}
  return false;
}
document.addEventListener('keydown',event=>{
  const editable=event.target.closest('input,textarea,select,[contenteditable=true]');
  if(event.key==='Escape'){if(escapeLayer()){event.preventDefault();event.stopPropagation();}return;}
  if((event.ctrlKey||event.metaKey)&&!event.altKey&&event.key.toLowerCase()==='f'&&state.view==='logs'){event.preventDefault();event.stopPropagation();find();return;}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'&&state.view==='profiles'&&state.editing){event.preventDefault();void action('save-profile');return;}
  if(event.key==='Enter'&&event.target.dataset.input==='find'){event.preventDefault();moveMatch(event.shiftKey?-1:1);return;}
  if((event.key==='Enter'||event.key===' ')&&event.target.classList.contains('rl-row')){event.preventDefault();void action('select-record',event.target);return;}
  if(((event.ctrlKey&&event.key==='End')||(event.metaKey&&event.key==='ArrowDown'))&&event.target.classList.contains('rl-records')){event.preventDefault();void action('bottom');return;}
  if(!editable&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&(event.key==='ArrowLeft'||event.key==='ArrowRight')){event.preventDefault();void action(event.key==='ArrowLeft'?'previous-variant':'next-variant');}
});
document.addEventListener('pointerdown',event=>{if(event.button===3&&state.view==='profiles'){event.preventDefault();closeProfiles();}});
setVariant(state.variant);
// No timer: all variants show identical stable data. Refresh appends one sample record.
