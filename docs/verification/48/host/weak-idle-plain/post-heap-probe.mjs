import {driver,report} from '/home/max/work/freelens-json-logs/scripts/find-production-host/driver.mjs';
import {listenerHeap} from '/home/max/work/freelens-json-logs/scripts/find-production-host/listener-heap.mjs';
const d=await driver(),r={scope:'Later native heap after all completed idle comparisons and the plain repetition. Collection is explicit here and cannot replace an earlier failed sample.'};
try{r.before=await d.page.send('Memory.getDOMCounters');r.heap=await listenerHeap(d.page,'post-plain');r.after=await d.page.send('Memory.getDOMCounters');report('post-plain-heap',r);console.log(JSON.stringify(r));}finally{d.close();}
