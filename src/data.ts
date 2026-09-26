// Requirement catalogue: 85 physical security requirements in 10 domains, mapped to
// ISO 27001 clauses, ISO 27002 / Annex A, NIST SP 800-53 r5 and ASIS PAP-2021.
import raw from '../data/requirements.json';

export interface Domain { code: string; short: string; full: string }
export interface Req { id: string; d: string; t: string; c1: string[]; c2: string[]; n: string[]; a: string[]; note: string }
interface Catalogue {
  domains: Domain[]; reqs: Req[];
  t1: Record<string, string>; t2: Record<string, string>; tn: Record<string, string>; ta: Record<string, string>;
}

export const D = raw as Catalogue;

export type FwKey = 'c2' | 'c1' | 'n' | 'a';
export interface Framework { k: FwKey; name: string; short: string; titles: Record<string, string>; fmt: (id: string) => string }

export const FW: Framework[] = [
  { k: 'c2', name: 'ISO 27002 / Annex A', short: 'ISO 27002', titles: D.t2, fmt: (id) => id },
  { k: 'c1', name: 'ISO 27001', short: 'ISO 27001', titles: D.t1, fmt: (id) => 'Cl. ' + id },
  { k: 'n', name: 'NIST 800-53 r5', short: 'NIST', titles: D.tn, fmt: (id) => id },
  { k: 'a', name: 'ASIS PAP-2021', short: 'ASIS', titles: D.ta, fmt: (id) => 'PAP-' + id },
];
export const FWK = Object.fromEntries(FW.map((f) => [f.k, f])) as Record<FwKey, Framework>;
export const DOM = Object.fromEntries(D.domains.map((d) => [d.code, d])) as Record<string, Domain>;
export const REQ = Object.fromEntries(D.reqs.map((r) => [r.id, r])) as Record<string, Req>;

/** control id -> requirement ids, per framework */
export const IDX = {} as Record<FwKey, Record<string, string[]>>;
for (const f of FW) IDX[f.k] = {};
for (const r of D.reqs) for (const f of FW) for (const c of r[f.k]) (IDX[f.k][c] ||= []).push(r.id);

const natKey = (s: string) => s.replace(/\d+/g, (m) => m.padStart(4, '0'));
export const CTRL_ORDER = {} as Record<FwKey, string[]>;
for (const f of FW) {
  const ids = Object.keys(IDX[f.k]);
  CTRL_ORDER[f.k] = f.k === 'a' ? Object.keys(D.ta).filter((i) => IDX.a[i]) : ids.sort((a, b) => (natKey(a) < natKey(b) ? -1 : 1));
}
