(()=>{const p=global.__cv27,owned=p.config().profiles.filter(p=>p.name.startsWith('CV27 '));for(const item of owned)p.preferences.deleteProfile(item.id);return {removed:owned.map(p=>p.id)};})()
