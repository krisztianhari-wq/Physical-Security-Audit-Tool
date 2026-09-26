import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { buildWorkbook, assessmentRows, mergeRows, HEAD, readCsv, parseTime, fmtStamp } from '../src/xlsx';
import { counts, rollup, type Audit } from '../src/store';
import { D, REQ, IDX, CTRL_ORDER } from '../src/data';

const audit = (): Audit => ({
  id: 't1', subject: 'Budaörs DC', date: '2026-09-26', lead: 'Minta Anna', location: 'Budaörs', scope: 'Teszt "hatókör" <b>',
  status: 'closed', createdAt: 1, updatedAt: 2, closedAt: 1790000000000,
  A: {
    'GOV-01': { status: 'n', owner: 'Kovács Anna', note: 'Gate broken "x" <b> & ő', updatedAt: 1790000000000, updatedBy: 'Teszt Elek' },
    'PER-01': { status: 'c', owner: '', note: '', updatedAt: 1790000001000, updatedBy: 'Teszt Elek' },
  },
});

describe('catalogue', () => {
  it('has 85 requirements in 10 domains, every mapped control has a title', () => {
    expect(D.reqs.length).toBe(85);
    expect(D.domains.length).toBe(10);
    for (const r of D.reqs) {
      for (const c of r.c1) expect(D.t1[c]).toBeTruthy();
      for (const c of r.c2) expect(D.t2[c]).toBeTruthy();
      for (const c of r.n) expect(D.tn[c]).toBeTruthy();
      for (const c of r.a) expect(D.ta[c]).toBeTruthy();
    }
    expect(CTRL_ORDER.a.length).toBe(Object.keys(IDX.a).length);
  });
});

describe('counts and rollup', () => {
  it('rolls up to the worst status', () => {
    const a = audit();
    const c = counts(a);
    expect(c.n).toBe(1); expect(c.c).toBe(1); expect(c['']).toBe(83);
    expect(rollup(counts(a, ['GOV-01', 'PER-01']))).toBe('n');
    expect(rollup(counts(a, ['PER-01']))).toBe('c');
    expect(rollup(counts(a, ['PER-01', 'PER-02']))).toBe('prog');
    expect(rollup(counts(a, ['PER-02']))).toBe('none');
  });
});

describe('workbook', () => {
  it('keeps the 15-column interchange layout', () => {
    const rows = assessmentRows(audit());
    expect(rows[0]).toEqual(HEAD);
    expect(rows.length).toBe(86);
    const gov = rows.find((r) => r[0] === 'GOV-01')!;
    expect(gov[3]).toBe('Non-compliant');
    expect(gov[6]).toBe(fmtStamp(1790000000000));
  });
  it('writes a valid xlsx (checked with openpyxl by scripts/check-xlsx.py)', () => {
    const bytes = buildWorkbook(audit());
    expect(bytes[0]).toBe(0x50); expect(bytes[1]).toBe(0x4b);
    mkdirSync('tests/out', { recursive: true });
    writeFileSync('tests/out/sample.xlsx', bytes);
  });
});

describe('import merge', () => {
  it('round-trips and applies the merge rules', () => {
    const src = audit();
    const rows = assessmentRows(src);
    // fresh audit takes everything
    const A1: Audit['A'] = {};
    const r1 = mergeRows(A1, rows, 'Me', (id) => !!REQ[id]);
    expect(r1.taken).toBe(2); expect(A1['GOV-01'].note).toBe(src.A['GOV-01'].note);
    expect(r1.subject).toBe('Budaörs DC');
    // same timestamp, different content = edited in Excel -> taken
    const edited = rows.map((r) => [...r]); edited.find((r) => r[0] === 'GOV-01')![3] = 'Compliant';
    const r2 = mergeRows(A1, edited, 'Me', (id) => !!REQ[id]);
    expect(r2.taken).toBe(1); expect(A1['GOV-01'].status).toBe('c'); expect(A1['GOV-01'].updatedBy).toMatch(/^Excel edit/);
    // older file does not overwrite a newer local entry
    const r3 = mergeRows(A1, rows, 'Me', (id) => !!REQ[id]);
    expect(r3.kept).toBe(1); expect(A1['GOV-01'].status).toBe('c');
    // unknown ids and labels are reported
    const bad = [HEAD, ['XXX-99', '', '', 'Compliant'], ['GOV-02', '', '', 'Maybe']];
    const r4 = mergeRows({}, bad, 'Me', (id) => !!REQ[id]);
    expect(r4.unknown).toEqual(['XXX-99']); expect(r4.bad).toBe(1);
  });
  it('reads CSV with ; or , and Hungarian status labels', () => {
    const rows = readCsv('﻿ID;Status;Owner\nGOV-01;Nem megfelelő;"A; B"\n');
    expect(rows[1]).toEqual(['GOV-01', 'Nem megfelelő', 'A; B']);
    const A: Audit['A'] = {};
    mergeRows(A, rows, 'Me', (id) => !!REQ[id]);
    expect(A['GOV-01'].status).toBe('n');
  });
  it('parses timestamps (UTC text and Excel serial numbers)', () => {
    expect(parseTime('2026-09-26 10:00:00')).toBe(Date.UTC(2026, 8, 26, 10));
    expect(parseTime(46291)).toBe(Date.UTC(2026, 8, 26));
  });
});
