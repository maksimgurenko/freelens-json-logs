/** Extension-scoped SDK RPC only: every operation retains the requesting frame. */
export const FIND_OPEN = 'find-open';
export const FIND_REQUEST = 'find-request';
export const FIND_CONTROL = 'find-control';
export interface FindRpc { invoke(channel: string, ...args: unknown[]): Promise<unknown> }
