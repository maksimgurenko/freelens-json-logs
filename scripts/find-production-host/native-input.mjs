// Only the disposable graphical session may receive these virtual inputs.
import assert from 'node:assert/strict';
import { readFileSync, statSync, realpathSync, appendFileSync } from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';
import { privateSession } from './private-session.mjs';
import { scratch, evidence, run } from './config.mjs';

export function isolatedInput() {
  assert(['native-isolated', 'native-close-fixed'].includes(run));
  assert.equal(process.env.FREELENS_UI_MODE, undefined);
  const budget = JSON.parse(readFileSync(`${evidence}/budget.json`));
  assert(Date.now() / 1000 < budget.deadlineUnix, 'Native pass budget expired');
  const session = privateSession();
  const info = JSON.parse(readFileSync(`${scratch}/session.json`));
  assert.equal(info.runtime, budget.runtime);
  assert.equal(info.instance, budget.instance);
  assert.equal(info.hyprlandPid, budget.compositorPid);
  const socket = info.environment.WAYLAND_DISPLAY;
  assert.equal(realpathSync(socket), `${info.runtime}/wayland-1`);
  assert(statSync(socket).isSocket());
  assert.equal(statSync(info.runtime).mode & 0o777, 0o700);
  assert.equal(statSync(info.runtime).uid, process.getuid());
  const compositor = readFileSync(`/proc/${info.hyprlandPid}/environ`, 'utf8').split('\0');
  assert(compositor.includes(`XDG_RUNTIME_DIR=${info.runtime}`));
  assert(!compositor.some(x => x.startsWith('DBUS_SESSION_BUS_ADDRESS=')));
  assert.equal(realpathSync(`/proc/${info.hyprlandPid}/exe`), realpathSync('/usr/bin/Hyprland'));
  const host = readFileSync(`/proc/${session.pid}/environ`, 'utf8').split('\0');
  const profile = readFileSync(`${scratch}/integration-path`, 'utf8');
  assert(host.includes(`FREELENS_INTEGRATION_TESTING_DIR=${profile}`));
  assert(host.includes(`XDG_RUNTIME_DIR=${info.runtime}`));
  assert(!host.some(x => /^(DISPLAY|DBUS_SESSION_BUS_ADDRESS|FREELENS_UI_MODE)=/.test(x)));
  const env = { PATH: '/usr/bin:/bin', LANG: 'C.UTF-8', HOME: profile,
    XDG_RUNTIME_DIR: info.runtime, WAYLAND_DISPLAY: socket,
    HYPRLAND_INSTANCE_SIGNATURE: info.instance };
  return { session, env, profile };
}

export function native(command, args) {
  assert(['wtype', 'wl-paste', 'hyprctl', '.scratch/find/48-host/native-pointer',
    '.scratch/find/48-host/native-registry'].includes(command));
  const { env, session } = isolatedInput();
  const record = { at: new Date().toISOString(), command, args, pid: session.pid,
    instance: session.privateInstance, runtime: session.privateRuntime, environment: env };
  try {
    const value = execFileSync(command, args, { env, encoding: 'utf8', timeout: 10000 });
    record.exit = 0; record.stdout = value; return value;
  } catch (error) {
    record.exit = error.status; record.error = String(error); throw error;
  } finally {
    appendFileSync(`${evidence}/native-commands.jsonl`, JSON.stringify(record) + '\n');
  }
}

export function clipboard(text) {
  const { env } = isolatedInput();
  const child = spawn('wl-copy', ['--foreground', '--type', 'text/plain;charset=utf-8'],
    { env, stdio: ['pipe', 'ignore', 'pipe'] });
  child.stdin.end(text);
  appendFileSync(`${evidence}/native-commands.jsonl`, JSON.stringify({ at: new Date().toISOString(),
    command: 'wl-copy', args: ['--foreground', '--type', 'text/plain;charset=utf-8'],
    environment: env, pid: child.pid, text }) + '\n');
  return child;
}
