// Regression at the real user boundary: selecting text, then plain-clicking an
// already-selected row must inspect immediately. Selection is input-created.
import {connect,save,assert} from './host.mjs';
const h=await connect(),out={input:'Playwright trusted pointer in packaged Freelens',host:'1.10.3'};
try{
 await h.send('Page.bringToFront');const reset=await h.point("document.querySelector('.rl-version')");await h.send('Input.cancelDragging');await h.send('Input.dispatchMouseEvent',{type:'mouseReleased',...reset,button:'left',buttons:0,clickCount:1});
 await h.run(`(async()=>{const p=global.__cv26;await p.close();await p.display();await p.input('Inspection','inline');await p.click('Raw');await p.display(false);p.scroll();})()`);
 await h.drag(await h.rowPoint(0,'message',.01),await h.rowPoint(1,'message',.95));
 out.version=await h.run("document.querySelector('.readable-logs').dataset.version");out.selectionBeforeClick=await h.run('getSelection().toString()');out.inspectedBeforeClick=await h.selected();assert(out.selectionBeforeClick.length>100&&out.inspectedBeforeClick===null,'Regression preparation failed');
 await h.click(await h.rowPoint(0,'message',.2));out.inspectedAfterClick=await h.selected();out.passed=out.inspectedAfterClick==='0';
}finally{await h.close();save('selection-click-'+(out.version??'unknown'),out);}
assert(out.passed,'Normal click inside an existing selection did not inspect');
