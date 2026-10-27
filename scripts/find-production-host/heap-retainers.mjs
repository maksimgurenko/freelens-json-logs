// Private-profile diagnostic. Stream raw heap only to scratch, retain paths only.
import { readFileSync, writeFileSync, openSync, closeSync, writeSync, unlinkSync } from 'node:fs';
import assert from 'node:assert/strict';
import { connect } from './cdp.mjs';
import { scratch, evidence } from './config.mjs';
import { privateSession } from './private-session.mjs';
const session=privateSession();
const path=`${scratch}/renderer.heapsnapshot`;
const c=await connect(9241);
const cluster=[...c.contexts.values()].find(x=>x.auxData?.isDefault&&/^https:\/\/[^.]+\.renderer\./.test(x.origin));
assert(cluster,'Cluster frame required');
assert.equal(await c.evaluate('document.querySelectorAll(".readable-logs").length',cluster),0,'Unmount viewer before retention capture');
const fd=openSync(path,'w');
const stop=c.subscribe(m=>{if(m.method==='HeapProfiler.addHeapSnapshotChunk')writeSync(fd,m.params.chunk)});
try {
try{await c.send('HeapProfiler.takeHeapSnapshot',{reportProgress:false,exposeInternals:true});}
finally{stop();closeSync(fd);c.close();}
const bytes=readFileSync(path);
let at=0; const h={}; while(at<bytes.length){let end=bytes.indexOf(10,at);if(end<0)end=bytes.length;let line=bytes.toString('utf8',at,end).trim();at=end+1;if(!line)continue;if(line.startsWith('{\"snapshot\"')){Object.assign(h,JSON.parse(line.replace(/,$/,'')+'}'));}else if(line[0]==='\"'){const colon=line.indexOf(':'); const key=JSON.parse(line.slice(0,colon)); if(['nodes','edges','strings'].includes(key)) h[key]=JSON.parse(line.slice(colon+1).replace(/,$/,'').replace(/}$/, ''));} }
const nf=h.snapshot.meta.node_fields,ef=h.snapshot.meta.edge_fields,nw=nf.length,ew=ef.length,N=h.nodes,E=h.edges,S=h.strings;
const name=i=>S[N[i+nf.indexOf('name')]];
const targets=[];for(let i=0;i<N.length;i+=nw)if(N[i+nf.indexOf('type')]===h.snapshot.meta.node_types[0].indexOf('native')&&name(i).startsWith('<section class="readable-logs"'))targets.push(i);

// Breadth-first from strong roots gives one shortest strong path per node.
const parent=new Int32Array(N.length/nw).fill(-1),edge=new Int32Array(parent.length).fill(-1),offsets=new Uint32Array(parent.length);
let pos=0;for(let i=0;i<N.length;i+=nw){offsets[i/nw]=pos;pos+=N[i+nf.indexOf('edge_count')]*ew;}
const queue=new Uint32Array(parent.length);let head=0,tail=1;queue[0]=0;parent[0]=0;
const types=h.snapshot.meta.edge_types[0],eti=ef.indexOf('type'),eni=ef.indexOf('name_or_index'),toi=ef.indexOf('to_node');
while(head<tail){const j=queue[head++],end=j+1<parent.length?offsets[j+1]:E.length;for(let e=offsets[j];e<end;e+=ew){const type=types[E[e+eti]];if(type==='weak')continue;const to=E[e+toi]/nw;if(parent[to]!==-1)continue;parent[to]=j;edge[to]=e;queue[tail++]=to;}}
const paths=targets.map(i=>{const out=[];let j=i/nw;for(let depth=0;depth<80&&j>0&&parent[j]>=0;depth++){const e=edge[j],type=types[E[e+eti]],label=['element','hidden'].includes(type)?E[e+eni]:S[E[e+eni]];out.push({node:name(j*nw),type,edge:label,from:name(parent[j]*nw)});j=parent[j];}return out.reverse()});
writeFileSync(`${evidence}/retaining-paths.json`,JSON.stringify({session,note:'Sanitized shortest strong paths only. Raw private-profile heap is removed by the diagnostic finally block; this is one shortest non-weak retaining path per target, not a dominator analysis.',targets:targets.length,paths:paths.slice(0,5)},null,2)+'\n');console.log(JSON.stringify({detachedViewerPaths:paths.length}));

} finally { unlinkSync(path); }
