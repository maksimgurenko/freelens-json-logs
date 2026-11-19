import type { FindTransport } from '../core/find-protocol.ts';

/** Extension-scoped SDK RPC only: every operation retains the requesting frame. */
export const FIND_OPEN = 'find-open';
export const FIND_REQUEST = 'find-request';
export const FIND_CONTROL = 'find-control';

export function findTransport(rpc: { invoke(channel: string, ...args: unknown[]): Promise<unknown> }): FindTransport {
  return {
    open: viewer => rpc.invoke(FIND_OPEN, viewer),
    submit: (token, request) => rpc.invoke(FIND_REQUEST, token, request),
    control: (token, ...command) => rpc.invoke(FIND_CONTROL, token, command[0], command[1]),
  };
}
