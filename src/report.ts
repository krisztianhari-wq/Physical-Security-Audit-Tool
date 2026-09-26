// PDF report: A4 landscape pages built as HTML, measured for page breaks, rendered to canvas
// (html-to-image) and placed into a jsPDF document. Rendering HTML keeps accented characters intact.
import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { D, DOM, REQ } from './data';
import { t, stLabel, domShort, auditStatusLabel, getLang, type Status } from './i18n';
import { counts, getMe, type Audit } from './store';
import { esc } from './platform';
import appIcon from './assets/app-icon.png';

const PAGE_W = 1123, PAGE_H = 794; // A4 landscape at 96 dpi
const ORDER: Status[] = ['n', 'p', 'c', 'x', ''];

const fmtDate = (ms: number) => (ms ? new Date(ms).toLocaleString(getLang() === 'hu' ? 'hu-HU' : 'en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');

function seg(c: ReturnType<typeof counts>): string {
  const tot = c.total || 1;
  return `<div class="r-seg">${(['n', 'p', 'c', 'x'] as Status[]).map((k) => (c[k] ? `<span class="s-${k}" style="width:${(c[k] / tot) * 100}%"></span>` : '')).join('')}</div>`;
}

function header(a: Audit): string {
  return `<div class="r-head"><div class="r-brand"><img class="r-icon" src="${appIcon}" alt=""><div><b>${esc(t('reportTitle'))}</b><small>sadrobot · PhySec Audit</small></div></div>
    <div class="r-subj">${esc(a.subject)}</div><div class="r-class">${esc(t('confidential'))}</div></div>`;
}

function footer(a: Audit): string {
  return `<div class="r-foot"><span>${esc(t('confidential'))} · ${esc(t('reportTitle'))} · ${esc(a.subject)}</span><span>${esc(t('rightsShort'))}</span><span class="r-pno"></span></div>`;
}

function summaryPage(a: Audit): string {
  const c = counts(a);
  const done = c.total - c[''];
  const meta = [
    `${t('date')}: ${a.date || '-'}`, a.lead && `${t('lead')}: ${a.lead}`, a.location && `${t('location')}: ${a.location}`,
    `${t('auditStatus')}: ${auditStatusLabel(a.status)}${a.closedAt ? ` (${fmtDate(a.closedAt)})` : ''}`,
  ].filter(Boolean).map((s) => esc(String(s))).join('<i>·</i>');
  const kpis = ORDER.map((k) => `<div class="r-kpi"><span><i class="r-sq s-${k || 'na'}"></i>${esc(stLabel(k))}</span><b>${c[k]}</b><small>${Math.round((c[k] / c.total) * 100)}%</small></div>`).join('');
  const doms = D.domains.map((d) => {
    const dc = counts(a, D.reqs.filter((r) => r.d === d.code).map((r) => r.id));
    return `<tr><td>${esc(domShort(d.code, d.short))}</td><td class="r-bar">${seg(dc)}</td><td class="r-num">${dc.total - dc['']}/${dc.total}${dc.n ? ` · <b class="t-n">${dc.n} NC</b>` : ''}</td></tr>`;
  }).join('');
  const finds = D.reqs.filter((r) => ['n', 'p'].includes(a.A[r.id]?.status || ''))
    .sort((x, y) => (a.A[x.id].status === 'n' ? 0 : 1) - (a.A[y.id].status === 'n' ? 0 : 1));
  const shown = finds.slice(0, 7);
  const findHtml = shown.length ? shown.map((r) => {
    const x = a.A[r.id];
    return `<div class="r-find"><i class="r-strip s-${x.status}"></i><div><div class="r-fh"><b class="t-${x.status}">${r.id} · ${esc(stLabel(x.status))}</b>${x.owner ? `<span>${esc(t('owner'))}: ${esc(x.owner)}</span>` : ''}</div>
      <div class="r-ft">${esc(r.t)}</div>${x.note ? `<div class="r-fe">${esc(x.note)}</div>` : ''}</div></div>`;
  }).join('') + (finds.length > shown.length ? `<div class="r-more">+ ${finds.length - shown.length} ${esc(t('moreInApp'))} – ${esc(t('allReqs'))} →</div>` : '')
    : `<p class="r-muted">${esc(t('noFindings'))}</p>`;
  return `<div class="r-page">${header(a)}
    <div class="r-meta">${meta}<span class="r-gen">${esc(t('generated'))}: ${esc(fmtDate(Date.now()))}${getMe() ? ' · ' + esc(getMe()) : ''}</span></div>
    <div class="r-kpis"><div class="r-kpi r-prog"><span>${esc(t('progress'))}</span><b>${Math.round((done / c.total) * 100)}%</b><small>${done}/${c.total} ${esc(t('assessed'))}</small></div>${kpis}</div>
    ${seg(c)}
    <div class="r-cols"><div><h3>${esc(t('byDomain'))}</h3><table class="r-dom">${doms}</table></div>
      <div><h3>${esc(t('findings'))}</h3>${findHtml}</div></div>
    ${a.scope ? `<div class="r-scope"><b>${esc(t('scope'))}:</b> ${esc(a.scope)}</div>` : ''}
    ${footer(a)}</div>`;
}

function reqRow(a: Audit, id: string): string {
  const r = REQ[id]; const x = a.A[id];
  const st = (x?.status || '') as Status;
  const ctl = [r.c2.map((c) => 'A.' + c).join(', '), r.n.join(', ')].filter(Boolean).join(' · ');
  return `<tr><td class="r-id">${r.id}</td><td>${esc(r.t)}</td><td><span class="r-pill s-${st || 'na'}">${esc(stLabel(st))}</span></td>
    <td>${esc(x?.owner || '')}</td><td class="r-ev">${esc(x?.note || '')}</td><td class="r-ctl">${esc(ctl)}</td></tr>`;
}

const tableHead = () => `<table class="r-tab"><thead><tr><th style="width:62px">ID</th><th style="width:290px">${esc(t('colReq'))}</th><th style="width:108px">${esc(t('status'))}</th>
  <th style="width:110px">${esc(t('owner'))}</th><th>${esc(t('evidence'))}</th><th style="width:170px">${esc(t('colControls'))}</th></tr></thead><tbody></tbody></table>`;

/** Builds all pages into an off-screen host; returns the page elements. */
export function buildPages(a: Audit, host: HTMLElement): HTMLElement[] {
  host.innerHTML = summaryPage(a);
  const pages = [host.lastElementChild as HTMLElement];
  let page: HTMLElement | null = null, body: HTMLElement | null = null;
  const newPage = () => {
    host.insertAdjacentHTML('beforeend', `<div class="r-page">${header(a)}<h3 class="r-h">${esc(t('allReqs'))}</h3>${tableHead()}${footer(a)}</div>`);
    page = host.lastElementChild as HTMLElement; body = page.querySelector('tbody'); pages.push(page);
  };
  newPage();
  for (const d of D.domains) {
    const ids = D.reqs.filter((r) => r.d === d.code).map((r) => r.id);
    const rows = [`<tr class="r-grp"><td colspan="6">${esc(domShort(d.code, DOM[d.code].short))}</td></tr>`, ...ids.map((id) => reqRow(a, id))];
    rows.forEach((html, i) => {
      body!.insertAdjacentHTML('beforeend', html);
      if (page!.scrollHeight > PAGE_H + 1) {
        const last = body!.lastElementChild!; last.remove();
        // never leave a domain header alone at the bottom of a page
        const prev = body!.lastElementChild;
        const carry = prev && prev.classList.contains('r-grp') && i === 1 ? prev : null;
        carry?.remove();
        newPage();
        if (carry) body!.appendChild(carry); else if (i > 0) body!.insertAdjacentHTML('beforeend', `<tr class="r-grp"><td colspan="6">${esc(domShort(d.code, DOM[d.code].short))} (${getLang() === 'hu' ? 'folyt.' : 'cont.'})</td></tr>`);
        body!.appendChild(last);
      }
    });
  }
  pages.forEach((p, i) => { p.querySelector('.r-pno')!.textContent = `${i + 1} / ${pages.length}`; });
  return pages;
}

export async function buildPdf(a: Audit): Promise<Blob> {
  const host = document.createElement('div');
  host.className = 'rep';
  document.body.appendChild(host);
  try {
    const pages = buildPages(a, host);
    await (document.fonts?.ready ?? Promise.resolve());
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape', compress: true });
    for (let i = 0; i < pages.length; i++) {
      const canvas = await toCanvas(pages[i], { pixelRatio: 2, backgroundColor: '#ffffff', width: PAGE_W, height: PAGE_H, style: { margin: '0' } });
      if (i > 0) pdf.addPage('a4', 'landscape');
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 297, 210);
    }
    pdf.setProperties({ title: `${t('reportTitle')} – ${a.subject}`, subject: a.subject, author: a.lead || getMe(), creator: 'sadrobot PhySec Audit' });
    return pdf.output('blob');
  } finally {
    host.remove();
  }
}

export function reportName(a: Audit, ext: string): string {
  const safe = a.subject.normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '').slice(0, 60);
  return `${a.date || new Date().toISOString().slice(0, 10)}_PhySec_Audit${safe ? '_' + safe : ''}.${ext}`;
}
