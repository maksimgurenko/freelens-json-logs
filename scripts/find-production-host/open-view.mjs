import { execFileSync } from 'node:child_process';
import { driver, sleep } from './driver.mjs';
const d = await driver();
try {
  const clusterId = await d.page.evaluate(`(()=>{const R=global.LensExtensions.Renderer;const c=R.Catalog.getAllClusters()[0];if(!c)throw Error('Fixture cluster missing');R.Navigation.navigate('/cluster/'+c.id);return c.id;})()`, d.root());
  for (let i = 0; !d.cluster() && i < 300; i++) await sleep(20);
  await sleep(500);
  await d.bind(d.cluster());
  const pod = JSON.parse(execFileSync('kubectl', ['--context', 'kind-freelens-json-logs-spike', '-n', 'readable-logs-spike', 'get', 'pod', 'single-json', '-o', 'json'], { encoding: 'utf8' }));
  const params = { namespace: pod.metadata.namespace, pod: pod.metadata.name, podUid: pod.metadata.uid, clusterId };
  await d.page.evaluate(`global.__findRenderer.navigate('readable-logs',${JSON.stringify(params)});true`, d.cluster());
  await sleep(2500);
} finally { d.close(); }
