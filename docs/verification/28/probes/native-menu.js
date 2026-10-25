(() => {
  const {Menu}=process.getBuiltinModule('module').createRequire(process.execPath)('electron');
  const result=[];
  const walk=(menu,path=[])=>{for(const item of menu.items){const entry={id:item.id,label:item.label,accelerator:item.accelerator,enabled:item.enabled,path};result.push(entry);if(item.submenu)walk(item.submenu,[...path,item.label]);}};
  walk(Menu.getApplicationMenu());return result;
})()
