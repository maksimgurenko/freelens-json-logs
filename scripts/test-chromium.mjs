import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { delimiter, join, resolve } from 'node:path';

// Shared by isolated production-browser checks, including CI runners where
// Chrome is installed under a different executable name.
export async function chromePath() {
  const names = process.env.CHROME_BIN ? [process.env.CHROME_BIN] : ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable'];
  for (const name of names) {
    for (const path of name.includes('/') ? [resolve(name)] : process.env.PATH.split(delimiter).map(dir => join(dir, name))) {
      try { await access(path, constants.X_OK); return path; } catch { /* Try next executable. */ }
    }
  }
  throw new Error('Chromium/Chrome is required; set CHROME_BIN to its executable. No checks are skipped.');
}

// The production viewer registers only in a cluster iframe. Keep that frame
// same-origin in the isolated server so assertions can run from the CDP page.
export const clusterFixturePage = '<!doctype html><style>html,body,iframe{display:block;width:100%;height:100%;margin:0;border:0}</style><iframe src="/cluster-fixture" title="Cluster fixture"></iframe>';
export const inClusterFixture = expression => `document.querySelector('iframe')?.contentWindow.eval(${JSON.stringify(expression)})`;
