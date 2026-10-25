// Trusted Chromium input in the installed package. This supplements, and never
// substitutes for, physical-input.py plus the supervisor's physical test.
import {writeFileSync} from 'node:fs';
import {connect, assert, tick} from './host.mjs';
const h = await connect(), out = {package: '0.1.28', physical: false, checks: []};
const snapshot = () => h.run(`(() => {const r=document.querySelector('.readable-logs');return {url:location.href,history:history.length,profiles:!!r.querySelector('.rl-profile-editor'),query:r.querySelector('#rl-find').value,selected:r.querySelector('.rl-selected')?.dataset.recordIndex??null,top:r.querySelector('.rl-records').scrollTop,paused:!![...r.querySelectorAll('button')].find(e=>e.textContent==='Resume')};})()`);
const back = async expression => {
  const p = await h.point(expression);
  await h.send('Input.dispatchMouseEvent', {type:'mouseMoved', ...p});
  await h.send('Input.dispatchMouseEvent', {type:'mousePressed', ...p, button:'back', buttons:8, clickCount:1});
  await h.send('Input.dispatchMouseEvent', {type:'mouseReleased', ...p, button:'back', buttons:0, clickCount:1});
  await tick(100);
};
try {
  await h.send('Page.bringToFront');
  await h.run(`(() => {const r=document.querySelector('.readable-logs');if(r.dataset.version!=='0.1.28')throw Error('Wrong package');[...r.querySelectorAll('button')].find(e=>e.textContent==='Pause')?.click();r.querySelector('.rl-edit-profiles').focus();})()`);
  out.before = await snapshot();
  for (const dirty of [false, true]) {
    await h.clickLabel('Edit profiles');
    if (dirty) {
      await h.clickLabel('Duplicate');
      await h.run(`(() => {const e=document.querySelector('[aria-label="Profile name"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'CV28 unsaved input check');e.dispatchEvent(new Event('input',{bubbles:true}));e.focus();})()`);
    }
    await back(dirty ? 'document.querySelector("[aria-label=\\"Profile name\\"]")' : 'document.querySelector(".rl-profile-editor h2")');
    const after = await snapshot();
    assert(!after.profiles && after.url === out.before.url && after.history === out.before.history, 'Back did not return locally exactly once');
    out.checks.push({dirty, after});
  }
  out.passed = true;
} catch (error) {out.failure = String(error); throw error;}
finally {
  try {
    out.historyAfter = await h.send('Page.getNavigationHistory');
    await h.run(`(() => {const r=document.querySelector('.readable-logs');if(!r)return;[...r.querySelectorAll('button')].find(e=>e.textContent==='Back to logs')?.click();r.querySelector('.rl-edit-profiles').focus();})()`);
  } finally {
    await h.close();
    writeFileSync('docs/verification/28/packaged-input.json', JSON.stringify(out,null,2)+'\n');
  }
}
