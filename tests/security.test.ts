import { describe, it, expect, beforeEach } from 'vitest';
import { mergeRows, HEAD, buildWorkbook } from '../src/xlsx';
import { isReqId, restoreBackup, listAudits } from '../src/store';

// minimal in-memory localStorage for the store
const mem = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null), setItem: (k: string, v: string) => void mem.set(k, String(v)),
  removeItem: (k: string) => void mem.delete(k),
};
beforeEach(() => mem.clear());

describe('hostile input', () => {
  it('never treats prototype keys as requirement ids', () => {
    for (const k of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) expect(isReqId(k)).toBe(false);
    expect(isReqId('GOV-01')).toBe(true);
  });
  it('ignores prototype keys in imported rows', () => {
    const A: Record<string, any> = {};
    const r = mergeRows(A, [HEAD, ['__proto__', '', '', 'Compliant', 'x'], ['constructor', '', '', 'Compliant']], 'Me', isReqId);
    expect(r.taken).toBe(0); expect(r.unknown).toEqual(['__proto__', 'constructor']);
    expect(Object.getPrototypeOf(A)).toBe(Object.prototype);
  });
  it('rejects backups with malformed audit ids or prototype keys', () => {
    const evil = {
      app: 'physec-audit', version: 1, audits: [
        { id: 'x" onmouseover="alert(1)', subject: 's', A: {} },
        { id: 'goodid123', subject: '<img src=x onerror=alert(1)>', A: JSON.parse('{"__proto__":{"status":"c"},"GOV-01":{"status":"zz","owner":"<b>"}}') },
      ],
    };
    const res = restoreBackup(evil);
    expect(res.added).toBe(1);
    const a = listAudits()[0];
    expect(a.id).toBe('goodid123');
    expect(Object.keys(a.A)).toEqual(['GOV-01']);
    expect(a.A['GOV-01'].status).toBe('');   // unknown status dropped to "not assessed"
    expect(a.subject).toBe('<img src=x onerror=alert(1)>'); // stored as text, escaped when rendered
    expect(() => restoreBackup({ app: 'other', audits: [] })).toThrow();
  });
  it('escapes XML and strips control characters in the workbook', () => {
    const bytes = buildWorkbook({ id: 'abcdef1', subject: 'a</t><x>&"\u0001', date: '', lead: '', location: '', scope: '', status: 'open', createdAt: 1, updatedAt: 1, A: {} });
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain('a&lt;/t&gt;&lt;x&gt;&amp;&quot;');
    const sheet = text.slice(text.indexOf('<sheetData>'), text.indexOf('</sheetData>'));
    expect(sheet).not.toContain('\u0001');
  });
});
