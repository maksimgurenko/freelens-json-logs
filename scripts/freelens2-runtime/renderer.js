import React from 'react';
import * as Mobx from 'mobx';
import { Renderer, Common } from '@freelensapp/extensions';
import { store } from './store.js';

class Rpc extends Renderer.Ipc {}
export default class ProbeRenderer extends Renderer.LensExtension {
  stops = [];
  pages = new Set();
  reactions = [];
  clusterPages = [{ id: 'probe57', params: { namespace: '', pod: '', podUid: '', clusterId: '' },
    components: { Page: ({ params }) => {
      const [mounted] = React.useState(Date.now());
      const values = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, value.get()]));
      React.useEffect(() => {
        const viewer = `page57-${mounted}`;
        const token = this.rpc.invoke('open', viewer);
        let closed = false;
        const close = async () => { if (closed) return; closed = true; await this.rpc.invoke('control', await token, 'close'); };
        this.pages.add(close); this.pageToken = token;
        return () => { this.pages.delete(close); void close().catch(error => this.reactions.push({ closeError: String(error) })); };
      }, [mounted]);
      return React.createElement('div', { id: 'probe57-page', style: { background: '#000', color: '#fff', padding: 20 } },
        'Disposable v2 runtime contract fixture',
        React.createElement('pre', { id: 'probe57-params' }, JSON.stringify(values)),
        React.createElement('pre', { id: 'probe57-settings' }, JSON.stringify(store.toJSON())));
    } } }];
  kubeObjectMenuItems = [{ kind: 'Pod', apiVersions: ['v1'], components: {
    MenuItem: ({ object, toolbar }) => React.createElement(Renderer.Component.MenuItem, { onClick: () => {
      const cluster = Renderer.Catalog.getActiveCluster();
      return this.navigate('probe57', { clusterId: cluster.id, namespace: object.getNs(), pod: object.getName(), podUid: object.metadata.uid });
    }, 'data-probe57': toolbar ? 'toolbar' : 'menu' },
    React.createElement(Renderer.Component.Icon, { material: 'data_object', interactive: toolbar, tooltip: 'Runtime probe 57' }),
    React.createElement('span', { className: 'title' }, 'Runtime probe 57')),
  } }];
  async onActivate() {
    globalThis.__probe57 = this;
    this.rpc = Rpc.createInstance(this);
    const state = await this.rpc.invoke('state');
    this.problem = state.problem;
    if (!state.problem) store.loadExtension(this);
    this.stops.push(Mobx.reaction(() => store.value.get(), value => this.reactions.push({ layout: value.viewer.inspection })));
    this.stops.push(this.rpc.listen('probe57-echo', () => this.reactions.push({ echo: true })));
    this.ready = true;
  }
  async reset(confirmed) {
    const result = await this.rpc.invoke('reset', confirmed);
    if (!result.error) { this.problem = undefined; store.loadExtension(this); }
    return result;
  }
  get identity() { return { version: Common.App.version, react: React.version,
    reactIdentity: React === globalThis.FreelensExtensionApi.React,
    mobxIdentity: Mobx.reaction === globalThis.FreelensExtensionApi.Mobx.reaction,
    mobxObservable: globalThis.FreelensExtensionApi.Mobx.isObservable(store.value),
    href: location.href, visibility: document.visibilityState, focused: document.hasFocus() }; }
  edit(layout, name) { store.edit(layout, name); }
  data() { return store.toJSON(); }
  async onDeactivate() {
    await Promise.all([...this.pages].map(close => close()));
    this.pages.clear();
    for (const stop of this.stops.splice(0)) stop();
    this.ready = false;
  }
}
