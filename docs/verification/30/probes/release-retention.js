(async () => {
  const h = global.__rl19, { assert, state, input, click, button, tick, requests, root } = h;
  const cases = [];
  for (const container of ['bounded', 'over-tail', 'utf8-near', 'utf8-over', 'oversized', 'repeated', 'malformed', 'empty']) {
    h.expandedTail = container === 'over-tail';
    if (state().container === container) await h.refresh();
    else { await input('Container', container); for (let i=0; (!state().snapshot || state().refreshing) && i<2000; i++) await tick(2); if(button('Pause'))await click('Pause'); }
    const request = requests.at(-1), snapshot = state().snapshot;
    assert(request?.status === 200 && request.transmittedPath.includes('container='+container), 'Wrong genuine response for '+container);
    const lines = request.body === '' ? [] : request.body.split('\n'); const terminated = lines.at(-1) === ''; if(terminated)lines.pop();
    let start=lines.length, bytes=0;
    for(let index=lines.length-1;index>=Math.max(0,lines.length-1000);index--){const size=Buffer.byteLength(lines[index])+(index<lines.length-1||terminated?1:0);if(bytes+size>5*1024*1024)break;bytes+=size;start=index;}
    const suffix=lines.slice(start);
    assert(snapshot.returnedLines===lines.length && snapshot.records.length===suffix.length && snapshot.retainedBytes===bytes && snapshot.omittedLines===start, 'Retention counts/byte mismatch '+container);
    assert(snapshot.records.every((record,index)=>record.transportLine===suffix[index]), 'Original line changed '+container);
    assert(root().querySelectorAll('.rl-row').length===suffix.length,'Rendered count differs '+container);
    if(container==='bounded')assert(lines.length===1000&&start===0,'1000 boundary');
    if(container==='over-tail')assert(lines.length===1100&&start===100,'Real more-than-tail response');
    if(container==='utf8-near')assert(bytes>5*1024*1024*.98&&start===0,'Near budget fixture');
    if(container==='utf8-over')assert(start>0&&suffix.length>0&&root().innerText.includes('older record(s) omitted'),'Over-budget omission notice');
    if(container==='oversized')assert(snapshot.oversizedNewest&&snapshot.records.length===0&&root().innerText.includes('newest record exceeds')&&!root().innerText.includes('No logs returned'),'Oversized is not empty');
    if(container==='repeated')assert(snapshot.records.length===1000&&new Set(snapshot.records.map(r=>r.applicationText)).size===1,'Repeated records deduplicated');
    if(container==='malformed')assert(snapshot.records.length===9&&snapshot.records.slice(0,8).every(r=>!r.parsed)&&snapshot.records[6].applicationText===''&&snapshot.records[7].applicationText==='  '&&snapshot.records[8].parsed.msg==='decoded α\nline','Mixed/blank/escape parsing');
    if(container==='empty')assert(snapshot.returnedLines===0&&root().innerText.includes('No logs returned')&&!snapshot.oversizedNewest,'Genuine empty not distinct');
    cases.push({container,request:h.summary(request),returned:lines.length,retained:suffix.length,omitted:start,retainedBytes:bytes,oversizedNewest:snapshot.oversizedNewest,exactSuffix:true,firstApplication:snapshot.records[0]?.applicationText.slice(0,160),lastApplication:snapshot.records.at(-1)?.applicationText.slice(0,160),notice:[...root().querySelectorAll('.rl-notice,.rl-empty')].map(e=>e.textContent)});
    // Do not retain prior 5 MiB response copies in instrumentation between cases.
    for(const prior of requests.slice(0,-1))delete prior.body;
  }
  h.expandedTail=false;
  return {version:root().dataset.version,cases, note:'Owned Pod emits actual stdout once per container; Kubernetes supplies timestamps. Only over-tail changes the outgoing tailLines to 1100 to exercise genuine greater-than-requested input; all response bodies pass through unchanged. Independent byte/suffix oracle compared with installed production state and DOM.'};
})()
