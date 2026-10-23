(async()=>{const h=global.__rl19,{assert,root,input,click,tick}=h;
 await input('Inspection','bottom');const close=root().querySelector('[aria-label="Close record inspector"]');if(close){close.click();await tick();}
 assert(!root().querySelector('.rl-inspector'),'Bottom inspector reserves space without a selection');
 const noSelection=root().querySelector('.rl-records').getBoundingClientRect().height;
 root().querySelector('.rl-row').click();await tick();assert(root().querySelector('.rl-inspector .rl-detail'),'Bottom inspector did not open on selection');const withSelection=root().querySelector('.rl-records').getBoundingClientRect().height;assert(withSelection<noSelection,'Bottom inspector did not reserve height after selection');
 await click('Close');assert(!root().querySelector('.rl-inspector')&&Math.abs(root().querySelector('.rl-records').getBoundingClientRect().height-noSelection)<1,'Closing selection left Bottom space');
 root().querySelector('.rl-row').click();await tick();await input('Container','repeated');for(let i=0;(!h.state().snapshot||h.state().refreshing)&&i<1000;i++)await tick(5);if(h.button('Pause'))await click('Pause');assert(!root().querySelector('.rl-inspector')&&!root().querySelector('.rl-selected'),'Unavailable selection left Bottom inspector');assert(root().querySelector('[aria-label="Inspection"]').value==='bottom','Bottom preference was cleared');
 await input('Inspection','side');assert(root().querySelector('.rl-inspector-empty'),'Side empty-state behavior changed');await input('Inspection','bottom');
 return {version:root().dataset.version,noSelectionHeight:noSelection,selectedHeight:withSelection,collapsedWithoutSelection:true,opensOnSelection:true,collapsesOnClose:true,collapsesWhenSelectionUnavailable:true,savedBottomRetained:true,sideUnchanged:true};
})()
