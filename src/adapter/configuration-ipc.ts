export const SETTINGS_STATUS = 'readable-logs-settings-status';
export const SETTINGS_SAVE_PROFILE = 'readable-logs-settings-save-profile';
export const SETTINGS_RESET = 'readable-logs-settings-reset';
export const SETTINGS_CHANGED = 'readable-logs-settings-changed';

export interface SettingsStatus {
  path: string;
  problem?: string;
  backup?: string;
}

export interface ResetResult { backup?: string; error?: string }
export interface ResetReply extends ResetResult { status?: SettingsStatus }
