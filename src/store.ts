// Audits live in localStorage: an index of audit ids plus one key per audit.
// Works the same in a browser (PWA) and in the Tauri webview (desktop, iOS, Android).
import type { Status } from './i18n';
import { D, REQ } from './data';

/** Own-property check: keys such as __proto__ or constructor must never pass as requirement ids. */
export const isReqId = (id: string): boolean => Object.prototype.hasOwnProperty.call(REQ, id);
const ID_RE = /^[a-z0-9]{6,40}$/;

export interface Assessment { status: Status; owner: string; note: string; updatedAt: number; updatedBy: string }
export interface Audit {
  id: string;
  subject: string; date: string; lead: string; location: string; scope: string;
  status: 'open' | 'closed';
  createdAt: number; updatedAt: number; closedAt?: number;
  A: Record<string, Assessment>;
}
export interface Counts { c: number; p: number; n: number; x: number; '': number; total: number }

const IDX_KEY = 'psa.audits';
const auditKey = (id: string) => 'psa.audit.' + id;

let storageOk = true;
function lsGet(k: string): string | null { try { return localStorage.getItem(k); } catch { storageOk = false; return null; } }
function lsSet(k: string, v: string): boolean { try { localStorage.setItem(k, v); return true; } catch { storageOk = false; return false; } }
function lsDel(k: string): void { try { localStorage.removeItem(k); } catch { /* ignore */ } }

export function storageAvailable(): boolean {
  if (!lsSet('psa.test', '1')) return false;
  lsDel('psa.test');
  return storageOk;
}

function readIndex(): string[] {
  try { const v = JSON.parse(lsGet(IDX_KEY) || '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []; } catch { return []; }
}
const writeIndex = (ids: string[]) => lsSet(IDX_KEY, JSON.stringify(ids));

/** Keeps only known requirement ids and well-formed entries. */
function clean(a: Partial<Audit>): Audit | null {
  if (!a || typeof a.id !== 'string' || !ID_RE.test(a.id)) return null;
  const A: Record<string, Assessment> = {};
  for (const [id, v] of Object.entries(a.A && typeof a.A === 'object' ? a.A : {})) {
    if (!isReqId(id) || !v || typeof v !== 'object') continue;
    const st = (['c', 'p', 'n', 'x', ''] as Status[]).includes(v.status) ? v.status : '';
    A[id] = { status: st, owner: String(v.owner || ''), note: String(v.note || ''), updatedAt: Number(v.updatedAt) || 0, updatedBy: String(v.updatedBy || '') };
  }
  return {
    id: a.id, subject: String(a.subject || ''), date: String(a.date || ''), lead: String(a.lead || ''),
    location: String(a.location || ''), scope: String(a.scope || ''), status: a.status === 'closed' ? 'closed' : 'open',
    createdAt: Number(a.createdAt) || Date.now(), updatedAt: Number(a.updatedAt) || Date.now(),
    closedAt: a.closedAt ? Number(a.closedAt) : undefined, A,
  };
}

export function listAudits(): Audit[] {
  const out: Audit[] = [];
  for (const id of readIndex()) { const a = getAudit(id); if (a) out.push(a); }
  return out.sort((x, y) => y.createdAt - x.createdAt);
}

export function getAudit(id: string): Audit | null {
  try { return clean(JSON.parse(lsGet(auditKey(id)) || 'null')); } catch { return null; }
}

export function saveAudit(a: Audit): boolean {
  const ok = lsSet(auditKey(a.id), JSON.stringify(a));
  const ids = readIndex();
  if (!ids.includes(a.id)) { ids.push(a.id); writeIndex(ids); }
  return ok;
}

export function deleteAudit(id: string): void {
  lsDel(auditKey(id));
  writeIndex(readIndex().filter((x) => x !== id));
}

export function newAudit(meta: Pick<Audit, 'subject' | 'date' | 'lead' | 'location' | 'scope'>): Audit {
  const now = Date.now();
  const id = now.toString(36) + Math.random().toString(36).slice(2, 7);
  const a: Audit = { id, ...meta, status: 'open', createdAt: now, updatedAt: now, A: {} };
  saveAudit(a);
  return a;
}

export const stOf = (a: Audit, id: string): Status => a.A[id]?.status || '';

export function counts(a: Audit, ids: string[] = D.reqs.map((r) => r.id)): Counts {
  const c: Counts = { c: 0, p: 0, n: 0, x: 0, '': 0, total: ids.length };
  for (const id of ids) c[stOf(a, id)]++;
  return c;
}

/** Worst status among the given requirements: n > p > (partly assessed) > x (all N/A) > c. */
export function rollup(c: Counts): 'none' | 'n' | 'p' | 'prog' | 'x' | 'c' {
  if (!c.total) return 'none';
  if (c.n) return 'n';
  if (c.p) return 'p';
  const assessed = c.total - c[''];
  if (!assessed) return 'none';
  if (assessed < c.total) return 'prog';
  if (c.x === c.total) return 'x';
  return 'c';
}

// ---------- name of the current auditor ----------
export const getMe = (): string => lsGet('psa.me') || '';
export const setMe = (n: string): void => { lsSet('psa.me', n.trim()); };

// ---------- backup ----------
export interface Backup { app: 'physec-audit'; version: 1; exportedAt: string; audits: Audit[] }

export function makeBackup(): Backup {
  return { app: 'physec-audit', version: 1, exportedAt: new Date().toISOString(), audits: listAudits() };
}

/** Merges a backup: unknown audits are added, known ones replaced when the backup copy is newer. */
export function restoreBackup(data: unknown): { added: number; updated: number } {
  const b = data as Partial<Backup>;
  if (!b || b.app !== 'physec-audit' || !Array.isArray(b.audits)) throw new Error('bad backup');
  let added = 0, updated = 0;
  for (const raw of b.audits) {
    const a = clean(raw);
    if (!a) continue;
    const cur = getAudit(a.id);
    if (!cur) { saveAudit(a); added++; }
    else if (a.updatedAt > cur.updatedAt) { saveAudit(a); updated++; }
  }
  return { added, updated };
}
