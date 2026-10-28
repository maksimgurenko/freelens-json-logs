// Fresh private profile: install identical extension for both viewer treatments.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connect } from './cdp.mjs';
import { scratch } from './config.mjs';
import { report, sleep } from './driver.mjs';
const page=await connect(9241),main=await connect(9242);
try {
  const root=[...page.contexts.values()].find(c=>c.auxData?.isDefault&&/^https:\/\/renderer\./.test(c.origin));
  await page.evaluate("global.LensExtensions.Renderer.Navigation.navigate('/extensions');true",root);
  await sleep(200);
  const packagePath=resolve('dist/freelens-readable-logs-0.1.34.tgz');
  await page.evaluate(`(()=>{const input=document.querySelector('input');if(!input)throw Error('Install input missing');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(packagePath)});input.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`,root);
  await sleep(100);
  await page.evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.innerText==='Install');if(!b)throw Error('Install button missing');b.click();return true;})()",root);
  for(let i=0;i<600;i++){
    if(await page.evaluate("document.body.innerText.includes('Enabled')",root))break;
    if(i===599)throw Error('Installed extension did not activate');
    await sleep(50);
  }
  const observer=readFileSync('scripts/find-production-host/observer.cjs','utf8')
    .replaceAll('/home/max/work/freelens-json-logs',process.cwd());
  const observed=await main.evaluate(observer);
  const clusterId=await page.evaluate("(()=>{const R=global.LensExtensions.Renderer;const c=R.Catalog.getAllClusters()[0];if(!c)throw Error('Fixture cluster missing');R.Navigation.navigate('/cluster/'+c.id);return c.id;})()",root);
  let cluster;
  for(let i=0;i<600;i++){
    cluster=[...page.contexts.values()].find(c=>c.auxData?.isDefault&&/^https:\/\/[^.]+\.renderer\./.test(c.origin));
    if(cluster&&await page.evaluate('!!global.LensExtensions?.Renderer?.K8sApi',cluster))break;
    await sleep(50);
  }
  assert(cluster,'Cluster frame missing');
  await page.evaluate("global.LensExtensions.Renderer.Navigation.navigate('/overview');true",cluster);
  report('comparison-setup',{observed,clusterId,profile:readFileSync(`${scratch}/integration-path`,'utf8'),packagePath});
  console.log(JSON.stringify({pass:true,clusterId}));
} finally {page.close();main.close();}
