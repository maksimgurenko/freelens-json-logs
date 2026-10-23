(() => {
 if(global.__rl12)throw Error('Probe exists');
 const probe={records:[],denied:false,hold:false,offline:false,held:[],restore:()=>{}};
 const restores=[];
 for(const protocol of ['http','https']) {
  const module=require(protocol);const original=module.request;
  module.request=function(...args) {
   const first=args[0];
   const path=typeof first==='string'?first:first instanceof URL?first.href:first?.path;
   const matches=path?.includes('/namespaces/readable-logs-spike/pods/changing-logs/log');
   if(probe.offline && matches) {
    if(typeof first==='string' || first instanceof URL){const url=new URL(first);url.port='9';args[0]=url;}
    else args[0]={...first,port:9};
   }
   const request=original.apply(this,args);
   if(request.path.includes('/namespaces/readable-logs-spike/pods/changing-logs/log')) {
    const record={path:request.path,protocol,closedPortFault:probe.offline,started:Date.now()};probe.records.push(record);
    if(probe.denied)request.setHeader('Impersonate-User','freelens-readable-logs-ticket-12-denied');
    request.on('response',response=>{record.status=response.statusCode;let body='';response.on('data',chunk=>{if(response.statusCode>=400 && body.length<5000)body+=chunk.toString();});response.on('end',()=>{record.settled=Date.now();if(body)record.body=body;});});
    request.on('error',error=>{record.error=error.message;record.settled=Date.now();});
    const end=request.end;
    request.end=function(...endArgs){
     if(probe.hold){probe.held.push(()=>end.apply(request,endArgs));return request;}
     return end.apply(request,endArgs);
    };
   }
   return request;
  };
  restores.push(()=>{module.request=original;});
 }
 probe.restore=()=>{probe.hold=false;for(const release of probe.held.splice(0))release();for(const restore of restores)restore();delete global.__rl12;};
 global.__rl12=probe;
 return {installed:true,transport:'Node http/https.request',note:'Real requests and responses; restores after validation'};
})()
