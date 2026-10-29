import { randomUUID } from 'node:crypto';
import { FindExecution, type FindWorker } from './find-execution.ts';
import type { FindRequest } from '../core/find-protocol.ts';

interface FrameIdentity { readonly processId: number; readonly routingId: number }
export interface FindSender {
  isDestroyed(): boolean;
  readonly mainFrame: { readonly framesInSubtree: readonly FrameIdentity[] };
  on(event: string, listener: (...args: any[]) => void): unknown;
  removeListener(event: string, listener: (...args: any[]) => void): unknown;
}
export interface FindCaller { sender: FindSender; senderFrame: FrameIdentity | null }
interface Owner {
  token: string; viewer: string; sender: FindSender; processId: number; routingId: number;
  execution: FindExecution;
}
const sameFrame = (a: FrameIdentity, b: FrameIdentity) => a.processId === b.processId && a.routingId === b.routingId;

/** Main-only SDK boundary. Tokens never confer ownership across webContents or
 * frames. Frame-tree membership also covers the pinned host's missing deletion
 * event. The one-second sweep is housekeeping, not a search/lifecycle deadline.
 */
export class FindService {
  private owners = new Map<string, Owner>();
  private retiring = new Map<Owner, Promise<void>>();
  private senders = new Map<FindSender, () => void>();
  private stopWatch?: () => void;
  private closed = false;
  private opening = new Map<string, Promise<string>>();
  private factory: () => FindWorker;
  private version: string;
  private watch: (sweep: () => void) => () => void;
  constructor(factory: () => FindWorker, version: string,
    watch: (sweep: () => void) => () => void = sweep => {
      const timer = setInterval(sweep, 1000); timer.unref(); return () => clearInterval(timer);
    }) { this.factory = factory; this.version = version; this.watch = watch; }

  private present(sender: FindSender, frame: FrameIdentity): boolean {
    try { return !sender.isDestroyed() && sender.mainFrame.framesInSubtree.some(entry => sameFrame(entry, frame)); }
    catch { return false; }
  }
  async open(caller: FindCaller, viewer: string): Promise<string> {
    // WebFrameMain is live: after navigation its getters can describe the new
    // document, so admission must retain the caller's original numeric identity.
    const receivedFrame = caller.senderFrame;
    const frame = receivedFrame && { processId: receivedFrame.processId, routingId: receivedFrame.routingId };
    if (this.closed || typeof viewer !== 'string' || !viewer || viewer.length > 128 || !frame ||
      !Number.isSafeInteger(frame.processId) || !Number.isSafeInteger(frame.routingId) || !this.present(caller.sender, frame)) throw new Error('Invalid Find viewer');
    // Serialize replacements of the same viewer in this frame without retaining
    // query/window descriptors. A new binding cannot bypass actual worker exit.
    const key = JSON.stringify([viewer, frame.processId, frame.routingId]);
    const previous = this.opening.get(key);
    let documentCurrent = true;
    const lost = () => { documentCurrent = false; };
    const navigated = (_event: unknown, _url: unknown, _status: unknown, _description: unknown, _main: unknown, processId: number, routingId: number) => {
      if (sameFrame(frame, { processId, routingId })) lost();
    };
    // Retiring the last owner removes its sender observers. Pending registration
    // still belongs to the old document until admission or rejection finishes.
    caller.sender.on('destroyed', lost); caller.sender.on('render-process-gone', lost); caller.sender.on('did-frame-navigate', navigated);
    const opening = (async () => {
      if (previous) await previous.catch(() => {});
      const old = [...this.owners.values(), ...this.retiring.keys()].filter(owner => owner.sender === caller.sender && owner.viewer === viewer && sameFrame(owner, frame));
      await Promise.all(old.map(owner => this.retire(owner)));
      if (this.closed || !documentCurrent || !this.present(caller.sender, frame)) throw new Error('Disposed Find viewer');
      const token = randomUUID();
      this.owners.set(token, { token, viewer, sender: caller.sender, processId: frame.processId, routingId: frame.routingId,
        execution: new FindExecution(this.factory, this.version) });
      this.observe(caller.sender);
      this.stopWatch ??= this.watch(() => this.sweep());
      return token;
    })();
    this.opening.set(key, opening);
    try { return await opening; }
    finally {
      caller.sender.removeListener('destroyed', lost); caller.sender.removeListener('render-process-gone', lost); caller.sender.removeListener('did-frame-navigate', navigated);
      if (this.opening.get(key) === opening) this.opening.delete(key);
    }
  }
  private owned(caller: FindCaller, token: string): Owner {
    const owner = this.owners.get(token);
    if (this.closed || !owner || caller.sender !== owner.sender || !caller.senderFrame || !sameFrame(owner, caller.senderFrame)) throw new Error('Foreign or disposed Find viewer');
    if (!this.present(owner.sender, owner)) { void this.retire(owner); throw new Error('Foreign or disposed Find viewer'); }
    return owner;
  }
  submit(caller: FindCaller, token: string, request: FindRequest) { return this.owned(caller, token).execution.submit(request); }
  cancel(caller: FindCaller, token: string) { return this.owned(caller, token).execution.cancel(); }
  setActive(caller: FindCaller, token: string, active: boolean) {
    if (typeof active !== 'boolean') throw new TypeError('Invalid Find activity');
    return this.owned(caller, token).execution.setActive(active);
  }
  close(caller: FindCaller, token: string) { return this.retire(this.owned(caller, token)); }
  private observe(sender: FindSender) {
    if (this.senders.has(sender)) return;
    const lost = () => { for (const owner of this.owners.values()) if (owner.sender === sender) void this.retire(owner); };
    // Navigation invalidates document ownership even if process/routing IDs are
    // reused; in-page navigation keeps the same document and is excluded.
    const navigated = (_event: unknown, _url: unknown, _status: unknown, _description: unknown, _main: unknown, processId: number, routingId: number) => {
      for (const owner of this.owners.values()) if (owner.sender === sender && sameFrame(owner, { processId, routingId })) void this.retire(owner);
      this.sweep();
    };
    sender.on('destroyed', lost); sender.on('render-process-gone', lost); sender.on('did-frame-navigate', navigated);
    this.senders.set(sender, () => {
      sender.removeListener('destroyed', lost); sender.removeListener('render-process-gone', lost); sender.removeListener('did-frame-navigate', navigated);
    });
  }
  private sweep() {
    for (const owner of this.owners.values()) if (!this.present(owner.sender, owner)) void this.retire(owner);
  }
  private retire(owner: Owner): Promise<void> {
    if (!this.owners.delete(owner.token)) return this.retiring.get(owner) ?? Promise.resolve();
    if (![...this.owners.values()].some(other => other.sender === owner.sender)) { this.senders.get(owner.sender)?.(); this.senders.delete(owner.sender); }
    if (!this.owners.size) { this.stopWatch?.(); this.stopWatch = undefined; }
    const closing = owner.execution.dispose();
    this.retiring.set(owner, closing);
    void closing.finally(() => this.retiring.delete(owner));
    return closing;
  }
  async dispose(): Promise<void> {
    this.closed = true;
    for (const owner of this.owners.values()) void this.retire(owner);
    await Promise.allSettled([...this.opening.values(), ...this.retiring.values()]);
  }
}
