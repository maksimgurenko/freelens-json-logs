export async function writeClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}
