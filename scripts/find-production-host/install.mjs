import { connect } from './cdp.mjs';
import { report, installPackage } from './driver.mjs';
const page = await connect(9241);
try {
  const root = [...page.contexts.values()].find(c => c.auxData?.isDefault && /^https:\/\/renderer\./.test(c.origin));
  await page.evaluate(`global.LensExtensions.Renderer.Navigation.navigate('/extensions');true`, root);
  await new Promise(resolve => setTimeout(resolve, 200));
  const result = await installPackage(page, root);
  report('initial-install-reproduction', { result });
} finally { page.close(); }
