// Shared attended-session gate for desktop-affecting verification.
import { execFileSync } from 'node:child_process';

export function requireAttended(read = command => JSON.parse(
  execFileSync('hyprctl', [command, '-j'], { encoding: 'utf8', timeout: 3000 }),
)) {
  if (process.env.FREELENS_UI_MODE !== 'attended') {
    throw Error('DEFERRED: this UI script requires an attended session. Use scripts/host-cdp.mjs for background probes/screenshots; arrange native checks with the user before setting FREELENS_UI_MODE=attended.');
  }
  const workspace = read('activeworkspace'), window = read('activewindow');
  if (workspace.id !== 7 || window.class?.toLowerCase() !== 'freelens') {
    throw Error('DEFERRED: focus Freelens on workspace 7 before starting attended verification. Tests will not switch there automatically.');
  }
}
