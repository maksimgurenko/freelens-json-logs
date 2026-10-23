import { systemClock, type Clock } from './requests.ts';

/** Poll supported Pod metadata, including while logs are explicitly paused.
 * Stopping invalidates late metadata failures as well as successes. */
export function observe<T>(load: () => Promise<T>, received: (value: T) => void,
  failed: (error: unknown) => void, clock: Clock = systemClock) {
  let stopped = false;
  let cancel: (() => void) | undefined;
  const read = async () => {
    try {
      const value = await load();
      if (stopped) return;
      received(value);
      if (!stopped) cancel = clock.schedule(3_000, () => { void read(); });
    } catch (error) {
      if (!stopped) failed(error);
    }
  };
  void read();
  return () => { stopped = true; cancel?.(); };
}
