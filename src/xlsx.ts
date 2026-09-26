// Minimal .xlsx writer/reader without libraries (stored ZIP, inline strings) and CSV reader.
// Sheet 1 "Assessment" keeps the 15-column layout of the original tool, so files stay interchangeable.
import { D, DOM } from './data';
import { ST_FILE, type Status } from './i18n';
import { counts, type Audit, type Assessment } from './store';

export const HEAD = ['ID', 'Domain', 'Requirement', 'Status', 'Owner', 'Evidence / findings', 'Last updated', 'Updated by',
  'ISO 27001 clauses', 'ISO 27001 Annex A', 'ISO 27002', 'NIST SP 800-53 r5', 'ASIS PAP-2021', 'Coverage note', 'Subject of audit'];
const WIDTHS = [10, 28, 60, 16, 22, 50, 20, 20, 18, 22, 50, 50, 50, 50, 28];

// ---------- ZIP (stored) ----------
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
export function crc32(b: Uint8Array): number { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

export function zip(files: [string, string][]): Uint8Array {
  const enc = new TextEncoder(); const parts: Uint8Array[] = []; const cen: Uint8Array[] = []; let off = 0;
  for (const [name, str] of files) {
    const nb = enc.encode(name), data = enc.encode(str), crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);
    lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, nb.length, true);
    parts.push(new Uint8Array(lh.buffer), nb, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
    ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, nb.length, true); ch.setUint32(42, off, true);
    cen.push(new Uint8Array(ch.buffer), nb);
    off += 30 + nb.length + data.length;
  }
  const csize = cen.reduce((s, a) => s + a.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, csize, true); end.setUint32(16, off, true);
  const all = [...parts, ...cen, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((s, a) => s + a.length, 0));
  let p = 0; for (const a of all) { out.set(a, p); p += a.length; }
  return out;
}

const xe = (s: unknown) => String(s ?? '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
export function colL(i: number): string { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }

/** UTC "YYYY-MM-DD HH:MM:SS", the timestamp format of the file (used by the merge on import). */
export const fmtStamp = (ms: number) => (ms ? new Date(ms).toISOString().slice(0, 19).replace('T', ' ') : '');

interface SheetSpec { name: string; rows: string[][]; widths: number[]; style: (r: number, c: number) => number; filter?: boolean; validation?: string; title: string }

function sheetXml(s: SheetSpec): string {
  const last = s.rows.length;
  const data = s.rows.map((row, ri) => `<row r="${ri + 1}">` + row.map((v, ci) =>
    `<c r="${colL(ci)}${ri + 1}" t="inlineStr" s="${s.style(ri, ci)}"><is><t xml:space="preserve">${xe(v)}</t></is></c>`).join('') + '</row>').join('');
  const ncol = Math.max(...s.rows.map((r) => r.length));
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols>${s.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>
<sheetData>${data}</sheetData>
${s.filter ? `<autoFilter ref="A1:${colL(ncol - 1)}${last}"/>` : ''}
${s.validation ? `<dataValidations count="1"><dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="${s.validation}${last}"><formula1>"Compliant,Partial,Non-compliant,Not applicable,Not assessed"</formula1></dataValidation></dataValidations>` : ''}
<pageMargins left="0.5" right="0.5" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
<pageSetup orientation="landscape" paperSize="9"/>
<headerFooter><oddHeader>&amp;L&amp;"Arial,Bold"${xe(s.title)}&amp;R&amp;"Arial,Bold"Confidential</oddHeader><oddFooter>&amp;LConfidential&amp;RPage &amp;P / &amp;N</oddFooter></headerFooter>
</worksheet>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="3"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/></font><font><b/><sz val="10"/><name val="Arial"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2F6497"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEEF4FA"/></patternFill></fill></fills>
<borders count="2"><border/><border><left style="thin"><color rgb="FFDCE7F1"/></left><right style="thin"><color rgb="FFDCE7F1"/></right><top style="thin"><color rgb="FFDCE7F1"/></top><bottom style="thin"><color rgb="FFDCE7F1"/></bottom></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

export function assessmentRows(a: Audit): string[][] {
  return [HEAD].concat(D.reqs.map((r) => {
    const x: Partial<Assessment> = a.A[r.id] || {};
    return [r.id, DOM[r.d].full, r.t, ST_FILE[(x.status || '') as Status], x.owner || '', x.note || '', fmtStamp(x.updatedAt || 0), x.updatedBy || '',
      r.c1.join('; '), r.c2.map((c) => 'A.' + c).join('; '), r.c2.map((c) => c + ' ' + D.t2[c]).join('; '),
      r.n.map((c) => c + ' ' + D.tn[c]).join('; '), r.a.map((c) => D.ta[c]).join('; '), r.note, a.subject];
  }));
}

function summaryRows(a: Audit): string[][] {
  const c = counts(a);
  const rows: string[][] = [['Field', 'Value'],
    ['Subject of audit', a.subject], ['Audit date', a.date], ['Lead auditor', a.lead], ['Location / site', a.location],
    ['Scope and notes', a.scope], ['Audit status', a.status === 'closed' ? 'Closed' : 'In progress'],
    ['Closed', a.closedAt ? fmtStamp(a.closedAt) + ' UTC' : ''],
    ['Assessed', `${c.total - c['']} / ${c.total}`], ['Compliant', String(c.c)], ['Partial', String(c.p)],
    ['Non-compliant', String(c.n)], ['Not applicable', String(c.x)], ['Not assessed', String(c[''])],
    ['Exported', fmtStamp(Date.now()) + ' UTC'], ['Classification', 'Confidential'], ['', ''],
    ['Domain', 'Assessed · Non-compliant · Partial · Compliant · N/A']];
  for (const d of D.domains) {
    const dc = counts(a, D.reqs.filter((r) => r.d === d.code).map((r) => r.id));
    rows.push([d.full, `${dc.total - dc['']}/${dc.total} · ${dc.n} · ${dc.p} · ${dc.c} · ${dc.x}`]);
  }
  return rows;
}

/** Two-sheet workbook: "Assessment" (importable) and "Summary". */
export function buildWorkbook(a: Audit): Uint8Array {
  const ass = assessmentRows(a);
  const sum = summaryRows(a);
  const s1 = sheetXml({ name: 'Assessment', rows: ass, widths: WIDTHS, filter: true, validation: 'D2:D', title: 'Physical Security Audit Report',
    style: (r, c) => (r === 0 ? 1 : [3, 4, 5, 6, 7].includes(c) ? 3 : 2) });
  const s2 = sheetXml({ name: 'Summary', rows: sum, widths: [34, 90], title: 'Physical Security Audit Report',
    style: (r, c) => (r === 0 || r === 17 ? 1 : c === 0 ? 4 : 2) });
  const last = ass.length;
  return zip([
    ['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`],
    ['_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Assessment" sheetId="1" r:id="rId1"/><sheet name="Summary" sheetId="2" r:id="rId2"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">Assessment!$A$1:$${colL(HEAD.length - 1)}$${last}</definedName></definedNames></workbook>`],
    ['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ['xl/worksheets/sheet1.xml', s1],
    ['xl/worksheets/sheet2.xml', s2],
    ['xl/styles.xml', STYLES],
  ]);
}

// ---------- reading ----------
async function unzip(buf: ArrayBuffer): Promise<Record<string, string>> {
  const dv = new DataView(buf), u8 = new Uint8Array(buf), out: Record<string, string> = {};
  let e = u8.length - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error('Not a valid .xlsx file');
  const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true);
  const dec = new TextDecoder();
  for (let i = 0; i < n; i++) {
    const method = dv.getUint16(p + 10, true), csz = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nl));
    p += 46 + nl + xl + cl;
    if (!/^(xl\/(workbook\.xml|sharedStrings\.xml|_rels\/workbook\.xml\.rels|worksheets\/[^/]+\.xml))$/.test(name)) continue;
    const ds = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true);
    const rawData = u8.subarray(ds, ds + csz);
    let data: Uint8Array;
    if (dv.getUint32(p - (46 + nl + xl + cl) + 24, true) > 60 * 1024 * 1024) throw new Error('The file is too large.');
    if (method === 0) data = rawData;
    else if (method === 8) {
      if (typeof DecompressionStream === 'undefined') throw new Error('This browser cannot read compressed .xlsx files; import a CSV instead.');
      data = new Uint8Array(await new Response(new Blob([rawData as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    } else continue;
    out[name] = dec.decode(data);
  }
  return out;
}
const xmlDoc = (s: string) => new DOMParser().parseFromString(s, 'application/xml');
const byTag = (node: Document | Element, tag: string) => [...node.getElementsByTagNameNS('*', tag)];

export async function readXlsx(buf: ArrayBuffer): Promise<unknown[][]> {
  const z = await unzip(buf);
  let sheetPath = 'xl/worksheets/sheet1.xml';
  try {
    const first = byTag(xmlDoc(z['xl/workbook.xml']), 'sheet')[0];
    const rid = first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || first.getAttribute('r:id');
    const rel = byTag(xmlDoc(z['xl/_rels/workbook.xml.rels']), 'Relationship').find((r) => r.getAttribute('Id') === rid);
    if (rel) sheetPath = 'xl/' + rel.getAttribute('Target')!.replace(/^\/?(xl\/)?/, '');
  } catch { /* default path */ }
  if (!z[sheetPath]) throw new Error('No worksheet found in the file');
  const ss = z['xl/sharedStrings.xml'] ? byTag(xmlDoc(z['xl/sharedStrings.xml']), 'si').map((si) => byTag(si, 't').map((t) => t.textContent).join('')) : [];
  const rows: unknown[][] = [];
  for (const row of byTag(xmlDoc(z[sheetPath]), 'row')) {
    const arr: unknown[] = [];
    for (const c of byTag(row, 'c')) {
      const letters = (c.getAttribute('r') || '').replace(/\d+/g, '');
      let ci = 0; for (const ch of letters) ci = ci * 26 + (ch.charCodeAt(0) - 64); ci--;
      if (ci < 0) ci = arr.length;
      const tt = c.getAttribute('t'); const v = byTag(c, 'v')[0]?.textContent;
      let val: unknown = '';
      if (tt === 's') val = ss[Number(v)] ?? '';
      else if (tt === 'inlineStr') val = byTag(c, 't').map((x) => x.textContent).join('');
      else if (v != null) val = tt === 'str' || tt === 'b' || tt === 'e' ? v : isNaN(+v) ? v : +v;
      arr[ci] = val;
    }
    rows.push(arr);
  }
  return rows;
}

export function readCsv(text: string): string[][] {
  text = text.replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/)[0] || '';
  const sep = firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';
  const rows: string[][] = []; let row: string[] = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
    else if (ch === '"') q = true;
    else if (ch === sep) { row.push(f); f = ''; }
    else if (ch === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; }
    else f += ch;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows;
}

export function parseTime(v: unknown): number {
  if (v === '' || v == null) return 0;
  if (typeof v === 'number') return v > 1e11 ? v : Math.round((v - 25569) * 86400000); // Excel serial date
  const s = String(v).trim();
  const tm = Date.parse(/\d{4}-\d{2}-\d{2} \d/.test(s) ? s.replace(' ', 'T') + (/Z|[+-]\d\d:?\d\d$/.test(s) ? '' : 'Z') : s);
  return isNaN(tm) ? 0 : tm;
}

const ST_BY_LABEL: Record<string, Status> = Object.fromEntries(Object.entries(ST_FILE).map(([k, v]) => [v.toLowerCase(), k as Status]));
Object.assign(ST_BY_LABEL, { 'n/a': 'x', na: 'x', '': '', 'megfelelő': 'c', 'részben megfelelő': 'p', 'nem megfelelő': 'n', 'nem alkalmazható': 'x', 'nem értékelt': '' });

export interface ImportResult { taken: number; kept: number; bad: number; unknown: string[]; subject: string }

/**
 * Merges imported rows into the audit's assessments, per requirement:
 * same content → nothing; no timestamp, or same second but different content → edited in Excel, taken over;
 * otherwise the newer timestamp wins.
 */
export function mergeRows(A: Record<string, Assessment>, rows: unknown[][], me: string, known: (id: string) => boolean): ImportResult {
  if (!rows.length) throw new Error('empty');
  const h = rows[0].map((x) => String(x ?? '').trim().toLowerCase());
  const col = (name: string) => h.indexOf(name.toLowerCase());
  const iId = col('ID'), iSt = col('Status'), iOw = col('Owner'), iNo = col('Evidence / findings'), iUp = col('Last updated'), iBy = col('Updated by'), iSys = col('Subject of audit');
  if (iId < 0 || iSt < 0) throw new Error('cols');
  const res: ImportResult = { taken: 0, kept: 0, bad: 0, unknown: [], subject: '' };
  for (const r of rows.slice(1)) {
    const id = String(r[iId] ?? '').trim(); if (!id) continue;
    if (!known(id)) { res.unknown.push(id); continue; }
    const stLabel = String(r[iSt] ?? '').trim().toLowerCase();
    if (!(stLabel in ST_BY_LABEL)) { res.bad++; continue; }
    const inc: Assessment = {
      status: ST_BY_LABEL[stLabel], owner: iOw >= 0 ? String(r[iOw] ?? '').trim() : '', note: iNo >= 0 ? String(r[iNo] ?? '') : '',
      updatedAt: iUp >= 0 ? parseTime(r[iUp]) : 0, updatedBy: iBy >= 0 ? String(r[iBy] ?? '').trim() : '',
    };
    const cur = A[id];
    const incEmpty = !inc.status && !inc.owner && !inc.note;
    const same = cur && (cur.status || '') === inc.status && (cur.owner || '') === inc.owner && (cur.note || '') === inc.note;
    if (same || (incEmpty && !inc.updatedAt)) continue;
    const curSec = cur && cur.updatedAt ? Math.floor(cur.updatedAt / 1000) : 0;
    const incSec = Math.floor(inc.updatedAt / 1000);
    const editedInExcel = !inc.updatedAt || (curSec > 0 && incSec === curSec);
    if (editedInExcel) { inc.updatedAt = Date.now(); inc.updatedBy = 'Excel edit' + (inc.updatedBy ? ` (${inc.updatedBy})` : me ? ` (${me})` : ''); }
    if (!cur || !curSec || editedInExcel || incSec > curSec) { A[id] = inc; res.taken++; } else res.kept++;
  }
  if (iSys >= 0) res.subject = rows.slice(1).map((r) => String(r[iSys] ?? '').trim()).find(Boolean) || '';
  return res;
}
