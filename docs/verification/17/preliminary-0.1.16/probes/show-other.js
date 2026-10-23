(async () => {
  const h = global.__rl17; await h.input('Profile', h.ids.first);
  const pod = await global.LensExtensions.Renderer.K8sApi.podsApi.get({ namespace: 'readable-logs-ticket-17-other', name: 'profiles' });
  global.LensExtensions.Renderer.Navigation.showDetails(pod.selfLink);
  return { uid: pod.metadata.uid, namespace: pod.getNs(), name: pod.getName(), labels: pod.metadata.labels };
})()
