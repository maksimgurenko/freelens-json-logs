import { scratch, evidence, ticket } from './config.mjs';
// Separate-session prerequisite from docs/agents/ui-verification.md. This does
// not change or bypass the attended guards used on the user's desktop.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
export function privateSession() {
  const info = JSON.parse(readFileSync(`${scratch}/session.json`, 'utf8'));
  const userEnvironment = execFileSync('systemctl', ['--user', 'show-environment'], { encoding: 'utf8' });
  assert(!userEnvironment.includes(`HYPRLAND_INSTANCE_SIGNATURE=${info.instance}\n`));
  assert(info.runtime.startsWith('/tmp/fd-'));
  const pid = Number(readFileSync(`${scratch}/host-pid`, 'utf8'));
  const environment = readFileSync(`/proc/${pid}/environ`, 'utf8').split('\0');
  assert(environment.includes(`WAYLAND_DISPLAY=${info.environment.WAYLAND_DISPLAY}`));
  assert(environment.some(x => x.startsWith(`FREELENS_INTEGRATION_TESTING_DIR=/tmp/freelens-production-find-${ticket}-`)));
  const clients = JSON.parse(execFileSync('hyprctl', ['clients', '-j'], { env: { ...process.env, ...info.environment }, encoding: 'utf8' }));
  const owned = clients.filter(c => c.pid === pid);
  assert(owned.length > 0); assert(owned.every(c => c.workspace.id === 7));
  return { pid, privateInstance: info.instance, privateRuntime: info.runtime, owned };
}
