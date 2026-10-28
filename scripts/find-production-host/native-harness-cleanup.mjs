// Exercise public harness failure paths only on an already proven private host.
import assert from 'node:assert/strict';
import {readdirSync,readFileSync,existsSync,renameSync,writeFileSync} from 'node:fs';
import {session,isolatedInput,evidence,sleep} from './native-completion-common.mjs';
function inputs(){const {env}=isolatedInput();return readdirSync('/proc').filter(x=>/^\d+$/.test(x)).filter(pid=>{try{const e=readFileSync(`/proc/${pid}/environ`).toString().split('\0'),cmd=readFileSync(`/proc/${pid}/cmdline`).toString();return e.includes(`XDG_RUNTIME_DIR=${env.XDG_RUNTIME_DIR}`)&&/wtype|native-pointer-session|native-ime-transactions/.test(cmd)}catch{return false}})}
const result={before:inputs()};assert.equal(result.before.length,0);
const identity=`${evidence}/package-identity.json`,saved=identity+'.cleanup-probe';
renameSync(identity,saved);
try{await session('expected-setup-failure');throw Error('Expected missing owned identity prerequisite')}catch(error){result.setupError=String(error);assert(result.setupError.includes('ENOENT'))}finally{renameSync(saved,identity)}
await sleep(100);result.afterSetup=inputs();assert.equal(result.afterSetup.length,0);
const s=await session('expected-final-probe-failure');const pids=s.owned.map(x=>x.pid);s.d.page.close();await sleep(20);await s.close();result.finalProbeError=s.result.finalProbeError;assert(result.finalProbeError);await sleep(100);result.childrenGone=pids.every(pid=>!existsSync(`/proc/${pid}`));assert(result.childrenGone);result.afterFinalProbe=inputs();assert.equal(result.afterFinalProbe.length,0);result.pass=true;process.exitCode=0;writeFileSync(`${evidence}/harness-cleanup.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
