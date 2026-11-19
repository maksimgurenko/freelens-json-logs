import { clipboard } from 'electron';

export function writeClipboard(text: string) {
  clipboard.writeText(text);
}
