// Preparation/restoration only; never generates the Back gesture being observed.
import {writeFileSync, readFileSync} from 'node:fs';
import {connect, assert, tick} from './host.mjs';
const [action, file] = process.argv.slice(2);
const kind = process.env.CV28_CONTEXT ?? 'dirty';
let restoredHistory;
if (action === 'restore') {
  // Restore joint page history before requiring the cluster execution context:
  // native Back may have left that frame entirely.
  const before = JSON.parse(readFileSync(file, 'utf8'));
  const targets = await (await fetch('http://127.0.0.1:9235/json/list')).json();
  const target = targets.find(item => item.type === 'page');
  assert(target, 'No owning host page during restoration');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, {once: true}); socket.addEventListener('error', reject, {once: true}); });
  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', ({data}) => {
    const reply = JSON.parse(data), waiter = pending.get(reply.id);
    if (waiter) { pending.delete(reply.id); clearTimeout(waiter.timer); reply.error ? waiter.reject(Error(JSON.stringify(reply.error))) : waiter.resolve(reply.result); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const number = ++id, timer = setTimeout(() => { pending.delete(number); reject(Error('History restore timeout')); }, 3000);
    pending.set(number, {resolve, reject, timer}); socket.send(JSON.stringify({id: number, method, params}));
  });
  try {
    restoredHistory = await send('Page.getNavigationHistory');
    const original = before.history.entries[before.history.currentIndex];
    if (restoredHistory.currentIndex !== before.history.currentIndex) {
      await send('Page.navigateToHistoryEntry', {entryId: original.id});
      await tick(300);
    }
  } finally { socket.close(); }
}
const h = await connect();
try {
  if (action === 'prepare') {
    const history = await h.send('Page.getNavigationHistory');
    const state = await h.run(`(() => {
      if (global.__cv28Guided) throw Error('Guided state already exists');
      const root = document.querySelector('.readable-logs');
      if (!root || root.querySelector('.rl-profile-editor') || root.querySelector('.rl-selected') ||
          !root.querySelector('.rl-findbar').hidden || root.querySelector('#rl-find').value) {
        throw Error('Requires the restored simple logs view: no draft, selection or query');
      }
      let fiber = root[Object.keys(root).find(key => key.startsWith('__reactFiber$'))];
      while (fiber && !fiber.memoizedProps?.preferences) fiber = fiber.return;
      if (!fiber) throw Error('Preferences unavailable');
      global.__cv28Guided = {focus: document.activeElement, preferences: fiber.memoizedProps.preferences, url: location.href,
        paused: !![...root.querySelectorAll('button')].find(e => e.textContent === 'Resume')};
      return {url: location.href, paused: global.__cv28Guided.paused, configuration: structuredClone(fiber.memoizedProps.preferences.read().configuration)};
    })()`);
    writeFileSync(file, JSON.stringify({history, ...state, kind, ownedIds: []}, null, 2) + '\n');
    if (kind === 'clean' || kind === 'logs') {
      await h.run(`(() => {const r=document.querySelector('.readable-logs');[...r.querySelectorAll('button')].find(e=>e.textContent==='Find').click();const e=r.querySelector('#rl-find');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'CV28 retained physical query');e.dispatchEvent(new Event('input',{bubbles:true}));r.querySelector('.rl-row').click();})()`);
    }
    if (kind !== 'logs') await h.run(`document.querySelector('.rl-edit-profiles').click()`);
    await tick(40);
    if (kind === 'dirty' || kind === 'confirmation') {
      const prepared = await h.run(`(() => {
      const panel = document.querySelector('.rl-profile-editor');
      const duplicate = [...panel.querySelectorAll('button')].find(e => e.textContent === 'Duplicate');
      if (!duplicate || duplicate.disabled) throw Error('No available Duplicate');
      duplicate.click();
      return true;
    })()`);
      assert(prepared, 'Draft not opened'); await tick(40);
      await h.run(`(() => {
      const input = document.querySelector('.rl-profile-editor [aria-label="Profile name"]');
      if (!input || input.disabled) throw Error('No active draft');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'CV28 discard this unsaved trace draft');
      input.dispatchEvent(new Event('input', {bubbles: true}));
      })()`);
      if (kind === 'confirmation') {
        await h.run(`[...document.querySelector('.rl-profile-editor').querySelectorAll('button')].find(e=>e.textContent==='Save profile').click()`);
        await tick(40);
        const owned = await h.run(`document.querySelector('[aria-label="Saved profile"]').value`);
        const checkpoint = JSON.parse(readFileSync(file, 'utf8')); checkpoint.ownedIds.push(owned);
        writeFileSync(file, JSON.stringify(checkpoint, null, 2) + '\n');
        await h.run(`[...document.querySelector('.rl-profile-editor').querySelectorAll('button')].find(e=>e.textContent==='Delete').click()`);
      }
    }
    const selector = kind === 'dirty' ? '.rl-profile-editor [aria-label="Profile name"]'
      : kind === 'confirmation' ? '.rl-profile-editor .rl-notice button:last-child'
      : kind === 'logs' ? '.rl-row' : kind === 'dock' ? '.Dock .Tab.active'
      : kind === 'disclosure' ? '.rl-target-context > summary' : '.rl-profile-editor h2';
    if (kind === 'disclosure') await h.run(`document.querySelector('.rl-target-context').open=true`);
    const point = kind === 'host' ? await h.rootRun(`(() => {
      const e=[...document.querySelectorAll('div[tabindex]')].find(e=>{const b=e.getBoundingClientRect();return b.x<80&&b.y>40&&b.y<200&&b.width>0;});
      if(!e)throw Error('No host sidebar focus target');e.focus({preventScroll:true});const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2,focus:'host sidebar',rootCoordinates:true};
    })()`) : await h.run(`(() => {
      const e = document.querySelector(${JSON.stringify(selector)});
      if (!e) throw Error('Physical target absent');e.scrollIntoView({block:'center'});e.focus({preventScroll:true});
      const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+Math.min(b.height,20)/2,focus:e.getAttribute('aria-label')??e.tagName};
    })()`);
    const checkpoint = JSON.parse(readFileSync(file, 'utf8'));
    writeFileSync(file, JSON.stringify({...checkpoint, point: {x: point.x + (point.rootCoordinates ? 0 : h.offset.x), y: point.y + (point.rootCoordinates ? 0 : h.offset.y)}, focus: point.focus}, null, 2) + '\n');
  } else if (action === 'restore') {
    const before = JSON.parse(readFileSync(file, 'utf8'));
    for (let i = 0; i < 100; i++) {
      if (await h.run(`location.href === ${JSON.stringify(before.url)} && !!document.querySelector('.readable-logs')`)) break;
      await tick(30);
    }
    const restored = await h.run(`(() => {
      const root = document.querySelector('.readable-logs');
      if (location.href !== ${JSON.stringify(before.url)} || !root) throw Error('Original route not restored');
      [...root.querySelectorAll('button')].find(e => e.textContent === 'Back to logs')?.click();
      root.querySelectorAll('details[open]').forEach(e=>{e.open=false;});
      root.querySelector('[aria-label="Close record inspector"]')?.click();
      root.querySelector('[aria-label="Close Find"]')?.click();
      const input=root.querySelector('#rl-find');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'');input.dispatchEvent(new Event('input',{bubbles:true}));
      let fiber = root[Object.keys(root).find(key => key.startsWith('__reactFiber$'))];
      while (fiber && !fiber.memoizedProps?.preferences) fiber = fiber.return;
      if (!fiber) throw Error('Preferences unavailable during restoration');
      const preferences=fiber.memoizedProps.preferences;
      const ownedProfilesBeforeCleanup=preferences.read().configuration.profiles.filter(p=>${JSON.stringify(before.ownedIds ?? [])}.includes(p.id)).map(p=>({id:p.id,name:p.name}));
      for(const id of ${JSON.stringify(before.ownedIds ?? [])}) preferences.deleteProfile(id);
      const config=preferences.read().configuration;
      if(JSON.stringify(config)!==${JSON.stringify(JSON.stringify(before.configuration))}) throw Error('Original application configuration differs');
      const desired = ${before.paused ? 'true' : 'false'};
      const button = [...root.querySelectorAll('button')].find(e => e.textContent === (desired ? 'Pause' : 'Resume'));
      button?.click();
      const oldFocus = global.__cv28Guided?.focus;
      if (oldFocus?.isConnected) oldFocus.focus({preventScroll: true});
      else root.querySelector('.rl-edit-profiles').focus({preventScroll: true});
      delete global.__cv28Guided;
      return {url: location.href, historyLength: history.length, profilesClosed: !root.querySelector('.rl-profile-editor'),
        paused: !![...root.querySelectorAll('button')].find(e => e.textContent === 'Resume'), probeRemoved: !global.__cv28Guided,
        ownedProfilesBeforeCleanup, originalConfigurationRestored:true};
    })()`);
    assert(restored.profilesClosed && restored.paused === before.paused, 'Guided state restoration failed');
    writeFileSync(file.replace(/\.json$/, '-restored.json'), JSON.stringify({beforeHistoryIndex: before.history.currentIndex, observedHistoryIndex: restoredHistory.currentIndex, ...restored}, null, 2) + '\n');
  } else throw Error('Usage: guided-state.mjs prepare|restore <state.json>');
} finally { await h.close(); }
