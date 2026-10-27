// connect verifies the private process environment and PID before app.quit.
import { connect } from './cdp.mjs';
const main = await connect(9242);
try { await main.evaluate("process.mainModule.require('electron').app.quit();true"); }
finally { main.close(); }
