(async () => {
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const tick = () => new Promise(r => setTimeout(r, 40));
  const root = () => document.querySelector('.readable-logs');
  const button = text => [...root().querySelectorAll('button')].find(b => b.textContent === text);
  const click = async text => { const b = button(text); assert(b && !b.disabled, 'Unavailable: '+text); b.click(); await tick(); };
  const change = async (label, value) => { const el = root().querySelector(`[aria-label="${label}"]`); assert(!el.disabled, label+' is disabled'); el.value=value; el.dispatchEvent(new Event('change',{bubbles:true})); await tick(); };
  const api = global.LensExtensions.Renderer.K8sApi.podsApi;
  const response = await api.getLogs({namespace:'readable-logs-ticket-14',name:'inspection'}, {container:'records',tailLines:1000,timestamps:true,follow:false,previous:false});
  const lines = response.split('\n'); if(lines.at(-1)==='')lines.pop();
  const expected = lines.map(transport => ({ transport, application:transport.slice(transport.indexOf(' ')+1) }));
  assert(expected.length===7, 'Fixture must include seven real records');
  const clipboard=require('electron').clipboard;
  const savedClipboard={text:clipboard.readText(),html:clipboard.readHTML(),rtf:clipboard.readRTF(),image:clipboard.readImage()};
  const clipboardFormats=clipboard.availableFormats();
  let requests=0;
  const restores=[];
  for(const protocol of ['http','https']){
    const module=require(protocol),original=module.request;
    module.request=function(...args){const request=original.apply(this,args);if(/\/namespaces\/readable-logs-ticket-14\/pods\/inspection\/log(?:\?|$)/.test(request.path))requests++;return request;};
    restores.push(()=>{module.request=original;});
  }
  global.__rl14={root,button,click,change,tick,assert,expected,requests:()=>requests,
    restore(){for(const restore of restores)restore();clipboard.write(savedClipboard);delete global.__rl14;}};
  const select = async index => {root().querySelectorAll('.rl-row')[index].click();await tick();};
  await select(0);
  assert(button('Pause'), 'Selecting a record silently paused automatic updates');
  assert(root().querySelector('.rl-selected')?.dataset.recordIndex==='0', 'Record not selected');
  const object = JSON.parse(expected[0].application);
  assert(JSON.stringify(JSON.parse(root().querySelector('[aria-label="Complete record"]').textContent))===JSON.stringify(object), 'Complete object changed');
  const layouts=[];
  for(const layout of ['inline','side','bottom']) {
    await change('Inspection',layout);
    assert(root().querySelector('.rl-work').classList.contains('rl-layout-'+layout), 'Layout did not actually change: '+layout);
    assert(!root().querySelector('.rl-error'), 'Settings problem');
    assert(root().querySelector('.rl-selected')?.dataset.recordIndex==='0', 'Layout lost selected record');
    assert(root().querySelector('.rl-detail'), 'No inspector in '+layout);
    assert(JSON.stringify(JSON.parse(root().querySelector('[aria-label="Complete record"]').textContent))===JSON.stringify(object), 'Layout lost complete fields');
    assert(button('Pause'), 'Layout paused automatic updates');
    layouts.push({layout,selected:0,completeObject:true,automatic:true});
  }
  await click('Raw');
  assert(root().querySelector('.rl-row .rl-message').textContent===expected[0].transport, 'Raw does not retain exact line');
  const timestamps=[...root().querySelectorAll('label')].find(l=>l.textContent==='Show timestamps').querySelector('input');
  timestamps.click();await tick();
  assert(root().querySelector('.rl-row .rl-message').textContent===expected[0].application, 'Raw without timestamps is not exact application text');
  timestamps.click();await tick();
  await click('Readable');
  // Pause explicitly for a deterministic copy matrix; selection/layout above remained automatic.
  await click('Pause');
  const copies=[];
  const beforeCopies=requests;
  for(let index=0;index<expected.length;index++){
    await select(index);
    for(const [kind,label,copy] of [['application','Application text','Copy application text'],['transport','Transport line','Copy transport line']]){
      await click(label);
      const shown=root().querySelector(`[aria-label="Original ${kind==='application'?'application text':'transport line'}"]`).textContent;
      assert(shown===expected[index][kind], 'Inspection differs: '+kind+' '+index);
      clipboard.writeText('sentinel-before-copy');
      await click(copy);
      const actual=clipboard.readText();
      assert(actual===expected[index][kind], 'Electron clipboard mismatch: '+kind+' '+index);
      copies.push({index,kind,expected:expected[index][kind],actual,pass:true});
    }
  }
  assert(requests===beforeCopies,'Inspect/copy made a log request while paused');
  assert(root().querySelectorAll('.rl-detail img').length===0,'Original text created active HTML');
  await select(0);await click('All fields');await change('Inspection','side');
  return {host:process.versions,version:root().dataset.version,clipboardFormats,layouts,copies,
    originalFields:object,raw:{exactTransport:true,exactApplication:true},copyRequestCount:requests-beforeCopies,
    state:{layout:'side',selected:0,paused:true,raw:false}};
})()
