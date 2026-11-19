export const SETTINGS_STATUS = 'readable-logs-settings-status';
export const SETTINGS_RESET = 'readable-logs-settings-reset';
export const SETTINGS_RESET_COMPLETE = 'readable-logs-settings-reset-complete';

export interface SettingsStatus {
  path: string;
  problem?: string;
}

export interface ResetResult { backup?: string; error?: string }
