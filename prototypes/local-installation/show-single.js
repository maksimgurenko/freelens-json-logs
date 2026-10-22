(async () => {
  const pod = await global.LensExtensions.Renderer.K8sApi.podsApi.get({namespace:'readable-logs-spike',name:'single-json'});
  global.LensExtensions.Renderer.Navigation.showDetails(pod.selfLink);
  return {selfLink:pod.selfLink, uid:pod.getId()};
})()
