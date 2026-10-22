(async () => {
  for (let i = 0; i < 60; i++) {
    const action = document.querySelector('[data-spike="pod-action"]');
    if (action) { action.click(); return {clickCount:1}; }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Pod header action did not appear');
})()
