// PROTOTYPE: exercises supported APIs; deliberately omits product formatting/UI.
const {Renderer} = global.LensExtensions;
const React = global.React;
const {observer} = global.MobxReact;
const {store} = require('./store');
const h = React.createElement;
const pageId = 'readable-logs-host-spike';
const activePages = new Set();
const preStyle = {whiteSpace:'pre-wrap', overflowWrap:'anywhere', background:'var(--contentColor, #15171b)', padding:12, maxHeight:220, overflow:'auto'};

function splitRecords(raw) {
  const lines = raw.split('\n');
  if (lines.at(-1) === '') lines.pop();
  let bytes = 0;
  const retained = [];
  for (let index = lines.length - 1; index >= 0; index--) {
    const size = new TextEncoder().encode(lines[index] + '\n').length;
    if (bytes + size > 5 * 1024 * 1024) break;
    retained.unshift(lines[index]);
    bytes += size;
  }
  return {returnedLines:lines.length, retainedBytes:bytes, omittedLines:lines.length-retained.length,
    records:retained.map(rawLine => {
      const prefix = rawLine.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z) (.*)$/s);
      const applicationText = prefix ? prefix[2] : rawLine;
      let parsed = null;
      try { const value = JSON.parse(applicationText); if (value && typeof value === 'object' && !Array.isArray(value)) parsed = value; } catch {}
      return {rawLine, kubernetesTimestamp:prefix?.[1] ?? null, applicationText, parsed};
    })};
}

class SpikePageBase extends React.Component {
  state = {containers:[], container:'', podUid:'', phase:'Loading Pod', paused:false,
    snapshot:null, requests:0, ignored:0, inflight:0, error:null, comparison:null, events:[]};
  alive = false;
  generation = 0;
  pendingTargets = new Set();
  queued = false;
  timer = null;
  param(key) { return this.props.params[key].get(); }
  target() { return {cluster:Renderer.Catalog.getActiveCluster()?.id, namespace:this.param('namespace'), pod:this.param('pod'), podUid:this.param('podUid'), container:this.state.container}; }
  event(text) { if (this.alive) this.setState(state=>({events:[...state.events.slice(-9), `${new Date().toISOString()} ${text}`]})); }
  componentDidMount() {
    this.alive = true;
    activePages.add(this);
    this.visibility = () => {
      this.generation++;
      clearTimeout(this.timer);
      this.event(`visibility=${document.visibilityState}`);
      if (!document.hidden && !this.state.paused) this.fetchSnapshot();
    };
    document.addEventListener('visibilitychange', this.visibility);
    this.loadPod();
  }
  componentDidUpdate(previousProps) {
    // The host may reuse a page while its declared query parameters change.
    const identity = `${this.param('namespace')}/${this.param('pod')}/${this.param('podUid')}`;
    if (identity !== this.loadedIdentity) this.loadPod();
  }
  componentWillUnmount() {
    this.alive = false;
    this.generation++;
    clearTimeout(this.timer);
    document.removeEventListener('visibilitychange', this.visibility);
    activePages.delete(this);
  }
  async loadPod() {
    const identity = `${this.param('namespace')}/${this.param('pod')}/${this.param('podUid')}`;
    this.loadedIdentity = identity;
    const generation = ++this.generation;
    clearTimeout(this.timer);
    this.setState({snapshot:null, error:null, containers:[], container:'', phase:'Loading Pod', paused:false});
    try {
      const pod = await Renderer.K8sApi.podsApi.get({namespace:this.param('namespace'), name:this.param('pod')});
      if (!this.alive || generation !== this.generation) return;
      if (!pod || pod.getId() !== this.param('podUid')) throw Error('Original Pod is gone or has been replaced');
      const containers = [...(pod.spec.containers ?? []), ...(pod.spec.initContainers ?? []), ...(pod.spec.ephemeralContainers ?? [])].map(c=>c.name);
      const regular = pod.spec.containers ?? [];
      const annotated = pod.metadata.annotations?.['kubectl.kubernetes.io/default-container'];
      const container = regular.find(c=>c.name === annotated)?.name ?? regular[0]?.name ?? '';
      this.setState({containers, container, podUid:pod.getId(), phase:'Pod loaded'}, ()=>this.fetchSnapshot());
    } catch (error) { if (this.alive && generation === this.generation) this.setState({error:this.describe(error), phase:'Pod error'}); }
  }
  describe(error) { return typeof error === 'string' ? error : error?.message ?? JSON.stringify(error); }
  async fetchSnapshot(timestamps = true, compare = false) {
    clearTimeout(this.timer);
    if (!this.alive || !this.state.container || document.hidden) return;
    const target = this.target();
    const key = JSON.stringify(target);
    if (this.pendingTargets.has(key)) { this.queued = true; this.event('Refresh queued behind same-target request'); return; }
    const generation = this.generation;
    this.queued = false;
    this.pendingTargets.add(key);
    this.setState(s=>({phase:'Reading logs', requests:s.requests+1, inflight:this.pendingTargets.size, error:null}));
    this.event(`request ${target.pod}/${target.container} timestamps=${timestamps}`);
    try {
      const raw = await Renderer.K8sApi.podsApi.getLogs({namespace:target.namespace, name:target.pod}, {container:target.container, tailLines:1000, timestamps, follow:false, previous:false});
      if (!this.alive) return;
      if (generation !== this.generation || key !== JSON.stringify(this.target())) {
        this.setState(s=>({ignored:s.ignored+1}));
        this.event(`ignored old response ${target.pod}/${target.container}`);
        return;
      }
      if (compare) this.setState({comparison:{timestamps, type:typeof raw, raw}, phase:'Diagnostic complete'});
      else this.setState({snapshot:{target, timestamps, receivedAt:new Date().toISOString(), returnedBytes:new TextEncoder().encode(raw).length, ...splitRecords(raw)}, phase:raw === '' ? 'Empty logs' : 'Snapshot accepted'});
    } catch (error) {
      if (this.alive && generation === this.generation) this.setState({error:this.describe(error), phase:'Log request failed', paused:true});
    } finally {
      this.pendingTargets.delete(key);
      if (this.alive) {
        this.setState({inflight:this.pendingTargets.size});
        if (this.queued) this.fetchSnapshot();
        else if (!this.state.paused && !document.hidden) this.timer = setTimeout(()=>this.fetchSnapshot(), 3000);
      }
    }
  }
  changeContainer(container) {
    this.generation++;
    clearTimeout(this.timer);
    this.queued = false;
    this.setState({container, snapshot:null, error:null, paused:false, comparison:null}, ()=>this.fetchSnapshot());
  }
  togglePause() {
    this.generation++;
    clearTimeout(this.timer);
    this.queued = false;
    this.setState(s=>({paused:!s.paused, phase:s.paused ? 'Resuming' : 'Paused'}), ()=>{
      this.event(this.state.paused ? 'paused' : 'resumed');
      if (!this.state.paused) this.fetchSnapshot();
    });
  }
  render() {
    const {container, containers, snapshot, phase, paused, error, comparison, ...diagnostic} = this.state;
    const cluster = Renderer.Catalog.getActiveCluster();
    const button = (id, title, onClick) => h('button', {'data-spike':id, onClick, style:{marginRight:8, padding:'5px 10px'}}, title);
    return h('div', {style:{padding:24, overflow:'auto', height:'100%'}, 'data-spike':'page'},
      h('h2', null, 'Disposable host integration spike'),
      h('p', null, 'Evidence for the first-release specification. Placeholder rendering; do not ship.'),
      h('pre', {'data-spike':'target', style:preStyle}, JSON.stringify({cluster:{id:cluster?.id, name:cluster?.name, contextName:cluster?.contextName}, ...this.target(), fetchedPodUid:this.state.podUid}, null, 2)),
      h('label', null, 'Container ', h('select', {value:container, 'data-spike':'container', onChange:event=>this.changeContainer(event.target.value)},
        containers.map(name=>h('option', {key:name, value:name}, name)))),
      h('span', {style:{marginLeft:12}}, button('pause', paused ? 'Resume' : 'Pause', ()=>this.togglePause()), button('refresh', 'Refresh', ()=>this.fetchSnapshot())),
      h('p', {'data-spike':'phase'}, `${phase}; ${paused ? 'paused' : 'automatic'}; ${snapshot?.records.length ?? 0} retained records`),
      error && h('pre', {'data-spike':'error', style:preStyle}, error),
      h('h3', null, 'Saved marker (shared ExtensionStore)'),
      h('input', {'data-spike':'marker', value:store.marker, onChange:event=>store.setMarker(event.target.value), style:{width:400, padding:6}}),
      h('p', {'data-spike':'saved-marker'}, `Renderer marker: ${store.marker}`),
      h('h3', null, 'Snapshot facts'),
      h('pre', {'data-spike':'facts', style:preStyle}, JSON.stringify(snapshot && {...snapshot, records:undefined, jsonObjects:snapshot.records.filter(r=>r.parsed).length}, null, 2)),
      h('h3', null, 'Raw timestamped lines (last 5)'),
      h('pre', {'data-spike':'raw', style:preStyle}, snapshot?.records.slice(-5).map(r=>r.rawLine).join('\n') ?? ''),
      h('h3', null, 'Separated application records (last 5)'),
      h('pre', {'data-spike':'records', style:preStyle}, JSON.stringify(snapshot?.records.slice(-5), null, 2)),
      button('compare', 'Diagnostic: request without timestamps', ()=>this.fetchSnapshot(false, true)),
      comparison && h('pre', {'data-spike':'comparison', style:preStyle}, JSON.stringify(comparison, null, 2)),
      h('details', null, h('summary', null, 'Request diagnostics'), h('pre', {'data-spike':'diagnostics', style:preStyle}, JSON.stringify(diagnostic, null, 2))));
  }
}
const SpikePage = observer(SpikePageBase);

exports.default = class HostSpikeRenderer extends Renderer.LensExtension {
  clusterPages = [{id:pageId, params:{namespace:'', pod:'', podUid:''}, components:{Page:props=>h(SpikePage, props)}}];
  kubeObjectMenuItems = [{kind:'Pod', apiVersions:['v1'], components:{MenuItem:props=>{
    if (!props.object) return null;
    return h(Renderer.Component.MenuItem, {'data-spike':'pod-action', onClick:()=>this.navigate(pageId, {namespace:props.object.getNs(), pod:props.object.getName(), podUid:props.object.getId()})},
      h(Renderer.Component.Icon, {material:'data_object', interactive:props.toolbar, tooltip:'Readable logs (host spike)'}),
      h('span', {className:'title'}, 'Readable logs (host spike)'));
  }}}];
  onActivate() { store.loadExtension(this); console.log('[READABLE-LOGS-HOST-SPIKE] renderer activated', {marker:store.marker}); }
  onDeactivate() { for (const page of activePages) page.componentWillUnmount(); console.log('[READABLE-LOGS-HOST-SPIKE] renderer deactivated'); }
};
