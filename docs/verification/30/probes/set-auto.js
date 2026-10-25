(async()=>{const p=global.__rl19;if(p.button('Resume'))await p.click('Resume');await p.tick(200);return {automatic:!p.state().paused};})()
