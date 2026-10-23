(async()=>{const h=global.__rl19;if(h.button('Resume'))await h.click('Resume');for(let i=0;h.state().refreshing&&i<1000;i++)await h.tick(5);return global.__rl13.state();})()
