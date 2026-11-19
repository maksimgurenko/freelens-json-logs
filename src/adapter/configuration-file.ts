import { chmodSync, closeSync, constants, copyFileSync, fstatSync, lstatSync, mkdirSync, openSync,
  readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { isUtf8 } from 'node:buffer';
import { configurationData, configurationProblem, defaultConfiguration } from '../core/configuration.ts';
import type { ResetResult } from './configuration-ipc.ts';

/** Inspect before constructing the SDK store: Conf can write migration metadata
 * during construction, even when its observable sync is not fireImmediately. */
export function inspectConfiguration(path: string): { data?: Record<string, unknown>; problem?: string } {
  let bytes: Buffer;
  try {
    // A pipe at the config path must not block main while waiting for a writer.
    const file = openSync(path, constants.O_RDONLY | constants.O_NONBLOCK);
    try {
      if (!fstatSync(file).isFile()) return { problem: 'The saved settings path is not a regular file.' };
      bytes = readFileSync(file);
    } finally { closeSync(file); }
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { data: defaultConfiguration() as unknown as Record<string, unknown> };
    return { problem: `Unable to read Readable logs settings: ${String(error)}` };
  }
  if (!isUtf8(bytes)) return { problem: 'Readable logs settings contain invalid UTF-8.' };
  try {
    const parsed: unknown = JSON.parse(bytes.toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { problem: 'The saved configuration is not an object.' };
    const data = configurationData(parsed as Record<string, unknown>);
    return { data, problem: configurationProblem(data) };
  } catch (error) { return { problem: `Readable logs settings contain invalid JSON: ${String(error)}` }; }
}

function replaceConfiguration(path: string, contents: string | Buffer, mode: number) {
  const temporary = join(dirname(path), `.readable-logs-reset-${randomUUID()}.tmp`);
  try {
    writeFileSync(temporary, contents, { flag: 'wx', mode });
    chmodSync(temporary, mode);
    renameSync(temporary, path);
  } finally {
    try { unlinkSync(temporary); } catch { /* Already renamed, or no temporary file was created. */ }
  }
}

/** Main-process only. Cancellation performs no I/O. Never truncate the source;
 * copy exclusively, verify bytes, then replace from a separate complete file.
 * This is not a crash-durability or transactional-filesystem guarantee. */
export function resetConfiguration(path: string, confirmed: boolean, bindSettings?: () => void): ResetResult {
  if (confirmed !== true) return { error: 'Reset canceled. Saved settings were not changed.' };
  let backup: string | undefined;
  try {
    const originalFile = lstatSync(path);
    if (!originalFile.isFile()) throw new Error('Settings must be a regular file to preserve a backup.');
    const original = readFileSync(path);
    const directory = join(dirname(path), 'backups');
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const destination = join(directory, `readable-logs-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}.json`);
    copyFileSync(path, destination, constants.COPYFILE_EXCL);
    if (!readFileSync(destination).equals(original)) throw new Error('Backup verification failed.');
    backup = destination;
    if (!readFileSync(path).equals(original)) throw new Error('Settings changed during backup; reset stopped.');
    replaceConfiguration(path, JSON.stringify(defaultConfiguration(), null, 2) + '\n', 0o600);
    try {
      bindSettings?.();
    } catch (error) {
      try { replaceConfiguration(path, original, originalFile.mode & 0o777); }
      catch (restoreError) {
        return { backup, error: `Unable to load or restore Readable logs settings. The original is backed up at ${backup}. ${String(error)} ${String(restoreError)}` };
      }
      return { backup, error: `Unable to load the reset settings. Original settings were restored. ${String(error)}` };
    }
    return { backup };
  } catch (error) {
    return { backup, error: `Unable to back up and reset Readable logs settings. Saved settings were not replaced. ${String(error)}` };
  }
}
