// Saving files and small dialogs on every platform:
// browser (download link, or share sheet on iOS Safari), Tauri desktop (native save dialog),
// Tauri iOS (share sheet), Tauri Android (native save picker; the webview has no Web Share).
import { t } from './i18n';

export const isTauri = (): boolean => '__TAURI_INTERNALS__' in window;
const isMobileUA = (): boolean => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isIOS = (): boolean => /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const MIME = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  json: 'application/json',
};

/** Must be called from a user gesture (click), the share sheet requires one. */
export async function saveFile(data: Blob | Uint8Array, filename: string, mime: string): Promise<boolean> {
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: mime });
  const ext = filename.split('.').pop() || '';
  if ((isTauri() && isMobileUA()) || (!isTauri() && isIOS())) {
    const file = new File([blob], filename, { type: mime });
    if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: filename }); return true; }
      catch (e) { if ((e as Error).name === 'AbortError') return false; }
    }
  }
  if (isTauri()) {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeFile } = await import('@tauri-apps/plugin-fs');
    const path = await save({ defaultPath: filename, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
    if (!path) return false;
    await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
    return true;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return true;
}

/** File picker that works in browsers and in every Tauri webview. */
export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = accept; inp.style.display = 'none';
    inp.addEventListener('change', () => { resolve(inp.files?.[0] || null); inp.remove(); });
    inp.addEventListener('cancel', () => { resolve(null); inp.remove(); });
    document.body.appendChild(inp); inp.click();
  });
}

// ---------- in-app dialogs (window.prompt/confirm do not exist in the mobile webviews) ----------
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export interface DialogButton { label: string; kind?: 'primary' | 'danger' | 'ghost'; value: string }

export function dialog(opts: { title: string; html: string; buttons: DialogButton[]; onOpen?: (root: HTMLElement) => void; validate?: (value: string, root: HTMLElement) => boolean }): Promise<{ value: string; root: HTMLElement }> {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="dlgT">
      <h2 id="dlgT">${esc(opts.title)}</h2><div class="modal-body">${opts.html}</div>
      <div class="modal-btns">${opts.buttons.map((b) => `<button type="button" class="btn ${b.kind || ''}" data-v="${esc(b.value)}">${esc(b.label)}</button>`).join('')}</div></div>`;
    document.body.appendChild(wrap);
    const finish = (value: string) => { wrap.remove(); document.removeEventListener('keydown', onKey); resolve({ value, root: wrap }); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') finish(''); };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('button[data-v]') as HTMLButtonElement | null;
      if (b) {
        const v = b.dataset.v || '';
        if (v && opts.validate && !opts.validate(v, wrap)) return;
        finish(v);
      } else if (e.target === wrap) finish('');
    });
    opts.onOpen?.(wrap);
    (wrap.querySelector('input,textarea') as HTMLElement | null)?.focus();
  });
}

export async function confirmDialog(title: string, text: string, okLabel: string, danger = false): Promise<boolean> {
  const r = await dialog({ title, html: `<p>${esc(text)}</p>`, buttons: [
    { label: t('cancel'), kind: 'ghost', value: '' }, { label: okLabel, kind: danger ? 'danger' : 'primary', value: 'ok' }] });
  return r.value === 'ok';
}

export async function messageDialog(title: string, text: string): Promise<void> {
  await dialog({ title, html: `<p>${esc(text)}</p>`, buttons: [{ label: t('ok'), kind: 'primary', value: 'ok' }] });
}

export async function promptDialog(title: string, label: string, value: string, hint = ''): Promise<string | null> {
  const r = await dialog({
    title, html: `<label class="fl" for="dlgIn">${esc(label)}</label><input id="dlgIn" type="text" value="${esc(value)}" autocomplete="off">${hint ? `<p class="hint">${esc(hint)}</p>` : ''}`,
    buttons: [{ label: t('cancel'), kind: 'ghost', value: '' }, { label: t('save'), kind: 'primary', value: 'ok' }],
    onOpen: (root) => root.querySelector('input')!.addEventListener('keydown', (e) => { if (e.key === 'Enter') (root.querySelector('button[data-v="ok"]') as HTMLButtonElement).click(); }),
  });
  return r.value === 'ok' ? (r.root.querySelector('#dlgIn') as HTMLInputElement).value : null;
}

let toastTimer = 0;
export function toast(msg: string): void {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { el!.hidden = true; }, 3600);
}

export { esc };
