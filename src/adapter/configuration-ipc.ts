import type { InspectionLayout } from '../core/configuration.ts';
import type { Profile } from '../core/profiles.ts';

export const SETTINGS_STATUS = 'readable-logs-settings-status';
export const SETTINGS_MUTATE = 'readable-logs-settings-mutate';
export const SETTINGS_RESET = 'readable-logs-settings-reset';
export const SETTINGS_CHANGED = 'readable-logs-settings-changed';

export type SettingsMutation =
  | { type: 'inspection'; layout: InspectionLayout }
  | { type: 'save-profile'; profile: Profile }
  | { type: 'delete-profile' | 'global-default'; id: string }
  | { type: 'move-profile'; id: string; direction: 1 | -1 };

export interface SettingsStatus {
  path: string;
  problem?: string;
  backup?: string;
}

export interface ResetResult { backup?: string; error?: string }
export interface ResetReply extends ResetResult { status?: SettingsStatus }
