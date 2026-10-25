import{connect,save}from'./host.mjs';const h=await connect();try{save('history-diagnostic',await h.send('Page.getNavigationHistory'))}finally{await h.close()}
