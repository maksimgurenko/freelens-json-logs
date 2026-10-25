(async()=>{
 const h=global.__cv25,{root,tick,assert,input,click}=h;
 await h.select('long-container-name-for-readable-compact-toolbar-layout-checks');await input('Profile',h.ownedProfileId);await click('Find');await input('Find in logs','row 09');await h.display();await input('Inspection','side');root().querySelectorAll('.rl-row')[8].click();await tick();
 const widths=[],old=root().style.width;
 try{for(const width of [1600,1200,1024,800,600,360]){
  root().style.width=width+'px';await tick(100);
  const r=root().getBoundingClientRect(),toolbar=root().querySelector('.rl-toolbar').getBoundingClientRect();
  const controls=[...root().querySelectorAll('.rl-toolbar button,.rl-toolbar select,.rl-toolbar summary,.rl-findbar button,.rl-findbar input,.rl-footer button')].filter(el=>el.getClientRects().length).map(el=>{const b=el.getBoundingClientRect();return {name:el.getAttribute('aria-label')||el.textContent?.trim().slice(0,30),left:b.left-r.left,right:b.right-r.left,width:b.width};});
  const overflow=controls.filter(c=>c.left<-.5||c.right>r.width+.5||c.width<=0);
  const actual={width:r.width,scrollWidth:root().scrollWidth,toolbarHeight:toolbar.height,controls,overflow,inspectorDirection:getComputedStyle(root().querySelector('.rl-work')).flexDirection};widths.push(actual);
  assert(!overflow.length&&root().scrollWidth<=root().clientWidth+1,'Controls overflow at '+width+': '+JSON.stringify(actual));
 }}finally{root().style.width=old;await h.display(false);}
 return {version:root().dataset.version,longContainer:h.state().container,longProfile:root().querySelector('[aria-label="Profile"]').title,widths};
})()
