export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    if (window.navigator.clipboard) {
      await window.navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* Fall back for local HTTP previews with clipboard restrictions. */ }
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  const copied = document.execCommand('copy');
  area.remove();
  return copied;
}
