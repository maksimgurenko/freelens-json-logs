import { constants, copyFileSync, lstatSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { configurationData, configurationProblem, defaultConfiguration } from '../core/configuration.ts';

export interface ResetResult { backup?: string; error?: string }

/** Inspect before constructing the SDK store: Conf can write migration metadata
 * during construction, even when its observable sync is not fireImmediately. */
export function inspectConfiguration(path: string): { data?: Record<string, unknown>; problem?: string } {
  let text: string;
  try { text = readFileSync(path, 'utf8'); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { data: defaultConfiguration() as unknown as Record<string, unknown> };
    return { problem: `Unable to read Readable logs settings: ${String(error)}` };
  }
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { problem: 'The saved configuration is not an object.' };
    const data = configurationData(parsed as Record<string, unknown>);
    return { data, problem: configurationProblem(data) };
  } catch (error) { return { problem: `Readable logs settings contain invalid JSON: ${String(error)}` }; }
}

/** Main-process only. Cancellation performs no I/O. Never truncate the source;
 * copy exclusively, verify bytes, then replace from a separate complete file.
 * This is not a crash-durability or transactional-filesystem guarantee. */
export function resetConfiguration(path: string, confirmed: boolean): ResetResult {
  if (confirmed !== true) return { error: 'Reset canceled. Saved settings were not changed.' };
  let backup: string | undefined, temporary: string | undefined;
  try {
    if (!lstatSync(path).isFile()) throw new Error('Settings must be a regular file to preserve a backup.');
    const original = readFileSync(path);
    const directory = join(dirname(path), 'backups');
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    backup = join(directory, `readable-logs-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}.json`);
    copyFileSync(path, backup, constants.COPYFILE_EXCL);
    if (!readFileSync(backup).equals(original)) throw new Error('Backup verification failed.');
    if (!readFileSync(path).equals(original)) throw new Error('Settings changed during backup; reset stopped.');
    temporary = join(dirname(path), `.readable-logs-reset-${randomUUID()}.tmp`);
    writeFileSync(temporary, JSON.stringify(defaultConfiguration(), null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    renameSync(temporary, path);
    return { backup };
  } catch (error) {
    return { backup, error: `Unable to back up and reset Readable logs settings. Saved settings were not replaced. ${String(error)}` };
  } finally {
    if (temporary) { try { unlinkSync(temporary); } catch { /* Already renamed, or no temporary file was created. */ } }
  }
}
