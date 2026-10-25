(async () => {
  const {Menu,BrowserWindow}=process.getBuiltinModule('module').createRequire(process.execPath)('electron');
  const action=__ARG_JSON__;
  if(!['go-back','go-forward'].includes(action))throw Error('Only the documented history menu actions are allowed');
  const window=BrowserWindow.getFocusedWindow();
  if(!window?.webContents.getURL().includes('/cluster/770814298afe692457d07d8b15d6b8d3'))throw Error('Owning cluster window must be focused');
  const item=Menu.getApplicationMenu().getMenuItemById(action);
  if(!item?.enabled)throw Error('Native history item unavailable');
  const before=window.webContents.navigationHistory.getActiveIndex();
  item.click(item,window,{});
  await new Promise(resolve=>setTimeout(resolve,100));
  return {action,accelerator:item.accelerator,windowId:window.id,pid:process.pid,before,after:window.webContents.navigationHistory.getActiveIndex()};
})()
