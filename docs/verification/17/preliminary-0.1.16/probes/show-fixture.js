(async () => {
  let pod;
  for (let i = 0; i < 100; i++) {
    try { pod = await global.LensExtensions.Renderer.K8sApi.podsApi.get({ namespace: 'readable-logs-ticket-17', name: 'profiles' }); break; }
    catch (error) { if (!String(error).includes('certificate has not been set') || i === 99) throw error; await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  global.LensExtensions.Renderer.Navigation.showDetails(pod.selfLink);
  return { uid: pod.metadata.uid, namespace: pod.getNs(), name: pod.getName() };
})()
