// Keep independent ticket runs and evidence out of historical verification.
import assert from 'node:assert/strict';
export const ticket = process.env.FIND_HOST_TICKET || '42';
assert(['42', '48'].includes(ticket), 'Unsupported host-verification ticket');
export const scratch = `.scratch/find/${ticket}-host`;
export const evidence = `docs/verification/${ticket}/host`;
