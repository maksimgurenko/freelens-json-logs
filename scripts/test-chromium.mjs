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
