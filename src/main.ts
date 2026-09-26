import './styles.css';
import appIcon from './assets/app-icon.png';
import srIcon from './assets/sadrobot.png';
import { D, FW, FWK, DOM, REQ, IDX, CTRL_ORDER, type FwKey } from './data';
import { t, stLabel, domShort, auditStatusLabel, getLang, setLang, type Status } from './i18n';
import {
  listAudits, getAudit, saveAudit, deleteAudit, newAudit, counts, rollup, stOf, getMe, setMe,
  makeBackup, restoreBackup, storageAvailable, isReqId, type Audit,
} from './store';
import { buildWorkbook, readXlsx, readCsv, mergeRows } from './xlsx';
import { buildPdf, reportName } from './report';
import { saveFile, pickFile, dialog, confirmDialog, messageDialog, promptDialog, toast, esc, MIME } from './platform';

declare const __APP_VERSION__: string;

type View = 'home' | 'list' | 'audit';
const introSeen = (): boolean => { try { return localStorage.getItem('psa.intro') === '1'; } catch { return false; } };
let view: View = introSeen() ? 'list' : 'home';
let cur: Audit | null = null;
const S = { fw: 'c2' as FwKey, ctl: null as null | { fw: FwKey; id: string }, dom: '', st: '*', q: '', req: null as string | null };
const L = { q: '', st: '' as '' | 'open' | 'closed' };
let noteDirty = false;

const $ = (id: string) => document.getElementById(id)!;
const app = document.getElementById('app')!;
const STS: Status[] = ['c', 'p', 'n', 'x', ''];
const MAX_IMPORT = 20 * 1024 * 1024, MAX_BACKUP = 50 * 1024 * 1024;

// Refuse to run inside a frame (clickjacking); GitHub Pages cannot send frame-ancestors headers.
if (window.top !== window.self) { document.body.textContent = 'PhySec Audit cannot run inside a frame.'; throw new Error('framed'); }

setLang(getLang());

// ---------- helpers ----------
const fmtAgo = (ms: number) => {
  if (!ms) return '';
  const s = (Date.now() - ms) / 1000;
  const hu = getLang() === 'hu';
  if (s < 60) return hu ? 'most' : 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} ${hu ? 'perce' : 'min ago'}`;
  if (s < 86400) return `${Math.floor(s / 3600)} ${hu ? 'órája' : 'h ago'}`;
  return new Date(ms).toLocaleDateString(hu ? 'hu-HU' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
};
function seg(c: ReturnType<typeof counts>): string {
  const tot = c.total || 1;
  return `<div class="seg" role="img" aria-label="${c.c} ${stLabel('c')}, ${c.p} ${stLabel('p')}, ${c.n} ${stLabel('n')}, ${c.x} ${stLabel('x')}, ${c['']} ${stLabel('')}">` +
    (['n', 'p', 'c', 'x'] as Status[]).map((k) => (c[k] ? `<span class="${k}" style="width:${(c[k] / tot) * 100}%"></span>` : '')).join('') + '</div>';
}
const isClosed = () => cur?.status === 'closed';
const today = () => new Date().toISOString().slice(0, 10);

// ---------- top bar ----------
function topbar(): string {
  const me = getMe();
  return `<header class="topbar"><div class="topbar-in">
    <button type="button" class="brand" data-act="home" title="${esc(t('homeTitle'))}"><img class="appicon" src="${appIcon}" alt=""><div><b>${esc(t('appName'))}</b><span>${esc(t('appTag'))}</span></div></button>
    <div class="spacer"></div>
    <button type="button" class="btn ghost sm" data-act="me" title="${esc(t('yourNameHint'))}">${me ? esc(t('you')) + ': ' + esc(me) : esc(t('setName'))}</button>
    <button type="button" class="btn ghost sm" data-act="backup">${esc(t('backup'))}</button>
    <button type="button" class="btn ghost sm" data-act="home">${esc(t('help'))}</button>
    <button type="button" class="btn sm" data-act="lang">${esc(t('lang'))}</button>
  </div></header>`;
}

const foot = () => `<footer class="foot"><img class="sricon" src="${srIcon}" alt=""><span>sadrobot · PhySec Audit v${__APP_VERSION__}</span></footer>`;

// ---------- start page ----------
function renderHome(): void {
  const has = listAudits().length > 0;
  const step = (n: number, h: string, p: string) => `<li class="card step"><span class="num">${n}</span><div><h3>${esc(h)}</h3><p>${esc(p)}</p></div></li>`;
  app.innerHTML = topbar() + `<main class="home">
    <section class="hero">
      <img class="hero-icon" src="${appIcon}" alt="">
      <div><h1>PhySec Audit</h1><p class="lead">${esc(t('homeLead'))}</p>
        <button type="button" class="btn primary big" data-act="start">${esc(has ? t('homeContinue') : t('homeStart'))} →</button></div>
    </section>
    <h2 class="home-h">${esc(t('homeHow'))}</h2>
    <ol class="steps">
      ${step(1, t('homeS1'), t('homeS1p'))}${step(2, t('homeS2'), t('homeS2p'))}${step(3, t('homeS3'), t('homeS3p'))}${step(4, t('homeS4'), t('homeS4p'))}
    </ol>
    <section class="card privacy"><h3>${esc(t('homePrivacy'))}</h3><p>${esc(t('homePrivacyP'))}</p></section>
    <p class="made"><img class="sricon" src="${srIcon}" alt="">${esc(t('homeMade'))}</p>
  </main>${foot()}`;
}

// ---------- list view ----------
function renderList(): void {
  const all = listAudits();
  const q = L.q.trim().toLowerCase();
  const items = all.filter((a) => (!L.st || a.status === L.st) && (!q || `${a.subject} ${a.lead} ${a.location}`.toLowerCase().includes(q)));
  const chip = (v: '' | 'open' | 'closed', lab: string) => `<button type="button" class="chip-btn" data-lst="${v}" aria-pressed="${L.st === v}">${esc(lab)}</button>`;
  const cards = items.map((a) => {
    const c = counts(a); const done = c.total - c[''];
    return `<button type="button" class="card acard" data-open="${esc(a.id)}">
      <div class="acard-h"><b>${esc(a.subject)}</b><span class="badge ${a.status === 'closed' ? 'b-closed' : 'b-open'}">${esc(auditStatusLabel(a.status))}</span></div>
      <div class="muted small">${esc([a.date, a.lead, a.location].filter(Boolean).join(' · '))}</div>
      ${seg(c)}
      <div class="small">${done}/${c.total} ${esc(t('assessed'))} · <span class="t-n">${c.n} ${esc(stLabel('n'))}</span> · <span class="t-p">${c.p} ${esc(stLabel('p'))}</span> · <span class="t-c">${c.c} ${esc(stLabel('c'))}</span></div>
      <div class="muted xs">${esc(t('lastChange'))}: ${esc(fmtAgo(a.updatedAt))}</div></button>`;
  }).join('');
  app.innerHTML = topbar() + `<main>
    <div class="top"><div><h1>${esc(t('audits'))}</h1><div class="sub">${esc(t('auditsSub'))}</div></div>
      <button type="button" class="btn primary" data-act="new">${esc(t('newAudit'))}</button></div>
    ${storageAvailable() ? '' : `<div class="banner warn">${esc(t('storageWarn'))}</div>`}
    <div class="tools"><input class="q" type="search" id="lq" value="${esc(L.q)}" placeholder="${esc(t('search'))}" aria-label="${esc(t('search'))}">
      ${chip('', t('all'))}${chip('open', t('open'))}${chip('closed', t('closed'))}</div>
    <div class="agrid">${cards || `<p class="empty">${esc(all.length ? t('noMatch') : t('noAudits'))}</p>`}</div>
  </main>${foot()}`;
}

// ---------- audit view: three tabs (requirements, control map, summary) ----------
type Tab = 'req' | 'map' | 'sum';
let tab: Tab = 'req';

function filtered() {
  const a = cur!;
  const q = S.q.trim().toLowerCase();
  const ctlSet = S.ctl ? new Set(IDX[S.ctl.fw][S.ctl.id] || []) : null;
  return D.reqs.filter((r) => {
    if (ctlSet && !ctlSet.has(r.id)) return false;
    if (S.dom && r.d !== S.dom) return false;
    if (S.st !== '*' && stOf(a, r.id) !== S.st) return false;
    if (q) {
      const x = a.A[r.id];
      const hay = [r.id, r.t, ...r.c1, ...r.c2, ...r.c2.map((c) => 'A.' + c), ...r.n, ...r.a, ...r.a.map((c) => 'PAP-' + c), x?.note || '', x?.owner || ''].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderAudit(): void {
  const a = cur!;
  const tabBtn = (k: Tab, lab: string) => `<button type="button" class="vtab" role="tab" data-tab="${k}" aria-selected="${tab === k}">${esc(lab)}</button>`;
  app.innerHTML = topbar() + `<main class="wide">
    <section class="card ahead">
      <button type="button" class="btn ghost sm" data-act="back">← ${esc(t('backToList'))}</button>
      <div class="ahead-t"><h1>${esc(a.subject)}</h1>
        <div class="sub">${esc([a.date, a.lead, a.location].filter(Boolean).join(' · '))} · <span class="badge ${a.status === 'closed' ? 'b-closed' : 'b-open'}">${esc(auditStatusLabel(a.status))}</span></div></div>
      <div class="ahead-b">
        <button type="button" class="btn sm" data-act="edit" ${isClosed() ? 'disabled' : ''}>${esc(t('edit'))}</button>
        <button type="button" class="btn sm" data-act="import" ${isClosed() ? 'disabled' : ''}>${esc(t('importXlsx'))}</button>
        <button type="button" class="btn sm" data-act="reports">${esc(t('reports'))}</button>
        <button type="button" class="btn sm ${isClosed() ? '' : 'primary'}" data-act="toggle">${esc(isClosed() ? t('reopen') : t('closeAudit'))}</button>
        <button type="button" class="btn sm danger-ghost" data-act="delete">${esc(t('deleteAudit'))}</button>
      </div>
    </section>
    ${isClosed() ? `<div class="banner">${esc(t('closedBanner'))}</div>` : ''}
    <nav class="vtabs" role="tablist">${tabBtn('req', t('requirements'))}${tabBtn('map', t('controlMap'))}${tabBtn('sum', t('summary'))}</nav>
    <div id="tabBody"></div>
  </main>${foot()}`;
  renderTab();
}

function setTab(k: Tab): void {
  tab = k;
  document.querySelectorAll('.vtab').forEach((b) => b.setAttribute('aria-selected', String((b as HTMLElement).dataset.tab === k)));
  renderTab();
}

function renderTab(): void {
  const body = $('tabBody');
  if (tab === 'req') {
    body.innerHTML = `<div class="reqgrid${S.req ? ' has-sel' : ''}">
      <section class="card panel reqlist">
        <div class="tools">
          <input class="q" type="search" id="q" value="${esc(S.q)}" placeholder="${esc(t('searchReqs'))}" aria-label="${esc(t('searchReqs'))}">
          <select id="fDom" aria-label="${esc(t('allDomains'))}"><option value="">${esc(t('allDomains'))}</option>${D.domains.map((d) => `<option value="${d.code}" ${S.dom === d.code ? 'selected' : ''}>${esc(domShort(d.code, d.short))}</option>`).join('')}</select>
          <select id="fSt" aria-label="${esc(t('allStatuses'))}"><option value="*">${esc(t('allStatuses'))}</option>${STS.map((k) => `<option value="${k}" ${S.st === k ? 'selected' : ''}>${esc(stLabel(k))}</option>`).join('')}</select>
        </div>
        <div class="listbar"><div id="ctlFilter"></div><span class="count" id="count"></span></div>
        <div class="tblwrap"><table><thead><tr><th style="width:78px">ID</th><th>${esc(t('colReq'))}</th><th style="width:170px">${esc(t('status'))}</th><th class="hide-s" style="width:150px">${esc(t('owner'))}</th><th class="hide-m" style="width:110px">${esc(t('updated'))}</th></tr></thead><tbody id="tbody"></tbody></table></div>
      </section>
      <section class="card panel detail" id="detail" aria-live="polite"></section>
    </div>`;
    buildDetail();
  } else if (tab === 'map') {
    body.innerHTML = `<section class="card panel"><div class="ph"><h2>${esc(t('controlMap'))}</h2><span class="hint">${esc(t('controlMapHint'))}</span><div class="spacer"></div><div class="tabs" id="tabs" role="tablist"></div></div>
      <div class="legend">${(['n', 'p', 'c', 'x'] as Status[]).map((k) => `<span><i class="dot s-${k}"></i>${esc(stLabel(k))}</span>`).join('')}<span><i class="dot s-prog"></i>${esc(t('partly'))}</span><span><i class="dot s-"></i>${esc(stLabel(''))}</span></div>
      <div class="tiles" id="tiles"></div></section>`;
  } else {
    body.innerHTML = `<section class="summary" id="summary"></section>
      <div class="sumgrid">
        <section class="card panel"><div class="ph"><h2>${esc(t('byDomain'))}</h2><span class="hint">${esc(t('byDomainHint'))}</span></div><div class="doms" id="doms"></div></section>
        <section class="card panel"><div class="ph"><h2>${esc(t('findings'))}</h2><span class="hint">${esc(t('findingsSub'))}</span></div><div class="finds" id="finds"></div></section>
        <section class="card panel"><div class="ph"><h2>${esc(t('auditDetails'))}</h2><div class="spacer"></div><button type="button" class="btn primary sm" data-act="reports">${esc(t('reports'))}</button></div><dl class="info" id="info"></dl></section>
        <section class="card panel"><div class="ph"><h2>${esc(t('recent'))}</h2></div><div class="act" id="act"></div></section>
      </div>`;
  }
  refreshAudit();
}

function refreshAudit(): void {
  const a = cur!;
  if (tab === 'req') {
    const rows = filtered();
    $('count').textContent = `${rows.length} / ${D.reqs.length} ${t('shown')}`;
    $('tbody').innerHTML = rows.map((r) => {
      const x = a.A[r.id];
      const st = stOf(a, r.id);
      return `<tr class="row${S.req === r.id ? ' sel' : ''}" data-req="${r.id}"><td><b class="mono">${r.id}</b></td>
        <td><div class="rtxt">${esc(r.t)}</div><div class="rdom">${esc(domShort(r.d, DOM[r.d].short))}${r.note ? ' · ' + esc(t('coverageNote').toLowerCase()) : ''}</div></td>
        <td><select class="st st-${st || 'na'}" data-req="${r.id}" aria-label="${esc(t('status'))} ${r.id}" ${isClosed() ? 'disabled' : ''}>${STS.map((k) => `<option value="${k}" ${k === st ? 'selected' : ''}>${esc(stLabel(k))}</option>`).join('')}</select></td>
        <td class="hide-s">${x?.owner ? esc(x.owner) : '<span class="muted">—</span>'}</td>
        <td class="hide-m muted xs">${x?.updatedAt ? esc(fmtAgo(x.updatedAt)) + (x.updatedBy ? '<br>' + esc(x.updatedBy) : '') : ''}</td></tr>`;
    }).join('') || `<tr><td colspan="5" class="empty">${esc(t('noReqMatch'))}</td></tr>`;
    $('ctlFilter').innerHTML = S.ctl ? `<button type="button" class="chip-btn" aria-pressed="true" data-act="clrCtl">${esc(t('controlFilter'))}: ${esc(FWK[S.ctl.fw].short)} ${esc(FWK[S.ctl.fw].fmt(S.ctl.id))} ×</button>` : '';
    refreshDetail();
  } else if (tab === 'map') {
    $('tabs').innerHTML = FW.map((f) => `<button type="button" role="tab" class="tab" data-fw="${f.k}" aria-selected="${S.fw === f.k}">${esc(f.name)} <span class="muted">${CTRL_ORDER[f.k].length}</span></button>`).join('');
    const f = FWK[S.fw];
    $('tiles').innerHTML = CTRL_ORDER[f.k].map((id) => {
      const ids = IDX[f.k][id]; const cc = counts(a, ids); const st = rollup(cc);
      return `<button type="button" class="tile" data-ctl="${f.k}:${esc(id)}" data-st="${st}" title="${esc(f.titles[id] || '')}">
        <span class="tid">${esc(f.fmt(id))}</span><span class="tt">${esc(f.titles[id] || '')}</span><span class="tf">${seg(cc)}<span>${cc.total - cc['']}/${cc.total}${cc.n ? ` · ${cc.n} NC` : ''}</span></span></button>`;
    }).join('');
  } else {
    const c = counts(a); const done = c.total - c[''];
    const k = (key: Status) => `<button type="button" class="card kpi" data-st="${key}"><span class="lab"><i class="dot s-${key}"></i>${esc(stLabel(key))}</span><span class="val">${c[key]}</span><span class="of">${Math.round((c[key] / c.total) * 100)}% / ${c.total}</span></button>`;
    $('summary').innerHTML = `<div class="card overall"><span class="eyebrow">${esc(t('progress'))}</span><span class="big">${Math.round((done / c.total) * 100)}%<small>${done} / ${c.total} ${esc(t('reqsAssessed'))}</small></span>${seg(c)}</div>` + STS.map(k).join('');
    $('doms').innerHTML = D.domains.map((d) => {
      const dc = counts(a, D.reqs.filter((r) => r.d === d.code).map((r) => r.id));
      return `<button type="button" class="drow" data-dom="${d.code}" title="${esc(d.full)}"><span class="dn">${esc(domShort(d.code, d.short))}</span><span class="dc">${dc.total - dc['']}/${dc.total}${dc.n ? ` · <b class="t-n">${dc.n} NC</b>` : ''}</span>${seg(dc)}</button>`;
    }).join('');
    const finds = D.reqs.filter((r) => ['n', 'p'].includes(stOf(a, r.id))).sort((x, y) => (stOf(a, x.id) === 'n' ? 0 : 1) - (stOf(a, y.id) === 'n' ? 0 : 1));
    $('finds').innerHTML = finds.length ? finds.map((r) => {
      const x = a.A[r.id];
      return `<button type="button" class="find" data-find="${r.id}"><i class="strip s-${x.status}"></i><span><span class="fh"><b class="t-${x.status}">${r.id} · ${esc(stLabel(x.status))}</b>${x.owner ? `<small>${esc(t('owner'))}: ${esc(x.owner)}</small>` : ''}</span>
        <span class="ft">${esc(r.t)}</span>${x.note ? `<span class="fe">${esc(x.note)}</span>` : ''}</span></button>`;
    }).join('') : `<p class="empty">${esc(t('noFindings'))}</p>`;
    const info: [string, string][] = [[t('subject'), a.subject], [t('date'), a.date], [t('lead'), a.lead], [t('location'), a.location],
      [t('auditStatus'), auditStatusLabel(a.status) + (a.closedAt ? ` · ${new Date(a.closedAt).toLocaleString(getLang() === 'hu' ? 'hu-HU' : 'en-GB')}` : '')], [t('scope'), a.scope]];
    $('info').innerHTML = info.filter(([, v]) => v).map(([k2, v]) => `<dt>${esc(k2)}</dt><dd>${esc(v)}</dd>`).join('');
    const items = Object.entries(a.A).filter(([, x]) => x.updatedAt).sort((x, y) => y[1].updatedAt - x[1].updatedAt).slice(0, 10);
    $('act').innerHTML = items.length ? items.map(([id, x]) => `<button type="button" data-find="${id}"><i class="dot s-${x.status}"></i><span><b class="mono">${id}</b> ${esc(stLabel(x.status))}<small>${x.updatedBy ? esc(x.updatedBy) + ' · ' : ''}${esc(fmtAgo(x.updatedAt))}</small></span></button>`).join('')
      : `<p class="empty">${esc(t('noActivity'))}</p>`;
  }
}

function buildDetail(): void {
  const a = cur!; const el = document.getElementById('detail');
  if (!el) return;
  noteDirty = false;
  if (S.req) {
    const r = REQ[S.req];
    const chips = FW.map((f) => `<div class="fwlab">${esc(f.name)}</div><div class="chips">${r[f.k].map((id) => `<button type="button" class="chip" data-ctl="${f.k}:${esc(id)}" title="${esc(f.titles[id] || '')}"><b class="mono">${esc(f.fmt(id))}</b> ${esc(f.titles[id] || '')}</button>`).join('') || `<span class="muted xs">${esc(t('noDirect'))}</span>`}</div>`).join('');
    el.innerHTML = `<button type="button" class="btn ghost sm only-narrow" data-act="closeDetail">← ${esc(t('backToReqs'))}</button>
      <div class="eyebrow">${esc(domShort(r.d, DOM[r.d].short))} · <b class="mono">${r.id}</b></div>
      <p class="dt">${esc(r.t)}</p>
      ${isClosed() ? `<div class="note">${esc(t('closedBanner'))}</div>` : ''}
      <label class="fl">${esc(t('status'))}</label><div class="sgroup" id="dStatus"></div>
      <label class="fl" for="ownIn">${esc(t('owner'))}</label>
      <div class="ownerline"><input type="text" id="ownIn" list="ownList" placeholder="${esc(t('ownerHint'))}" autocomplete="off" ${isClosed() ? 'disabled' : ''}><datalist id="ownList"></datalist></div>
      <div class="ownerline btns"><button type="button" class="btn ghost sm" id="ownMe">${esc(t('assignMe'))}</button><button type="button" class="btn ghost sm" id="ownClr">${esc(t('remove'))}</button></div>
      <label class="fl" for="dNote">${esc(t('evidence'))}</label>
      <textarea id="dNote" placeholder="${esc(t('evidenceHint'))}" ${isClosed() ? 'disabled' : ''}></textarea>
      <div class="saveline"><button type="button" class="btn primary sm" id="saveNote" ${isClosed() ? 'disabled' : ''}>${esc(t('saveNotes'))}</button>
        <button type="button" class="btn sm" data-act="nextReq">${esc(t('nextReq'))} →</button><span class="meta" id="dMeta"></span></div>
      ${r.note ? `<div class="note"><b>${esc(t('coverageNote'))}:</b> ${esc(r.note)}</div>` : ''}
      <div class="fwlab strong">${esc(t('mappedControls'))}</div>${chips}`;
    ($('dNote') as HTMLTextAreaElement).value = a.A[r.id]?.note || '';
  } else {
    el.innerHTML = `<div class="eyebrow">${esc(t('details'))}</div><p class="empty">${esc(t('selectPrompt'))}</p>`;
  }
}

function refreshDetail(): void {
  if (!S.req) return;
  const a = cur!; const x = a.A[S.req]; const v = x?.status || '';
  const sb = document.getElementById('dStatus'); if (!sb) return;
  sb.innerHTML = STS.map((k) => `<button type="button" class="sbtn" data-set="${k}" aria-pressed="${k === v}" ${isClosed() ? 'disabled' : ''}><i class="dot s-${k}"></i>${esc(stLabel(k))}</button>`).join('');
  const oi = $('ownIn') as HTMLInputElement;
  if (document.activeElement !== oi) oi.value = x?.owner || '';
  const names = new Set<string>(); if (getMe()) names.add(getMe());
  for (const y of Object.values(a.A)) { if (y.owner) names.add(y.owner); }
  $('ownList').innerHTML = [...names].sort().map((n) => `<option value="${esc(n)}"></option>`).join('');
  ($('ownMe') as HTMLButtonElement).hidden = isClosed() || !getMe() || x?.owner === getMe();
  ($('ownClr') as HTMLButtonElement).hidden = isClosed() || !x?.owner;
  const ta = $('dNote') as HTMLTextAreaElement;
  if (!noteDirty && document.activeElement !== ta) ta.value = x?.note || '';
  $('dMeta').textContent = noteDirty ? t('unsaved') : x?.updatedAt ? `${t('updated')}: ${fmtAgo(x.updatedAt)}${x.updatedBy ? ' · ' + x.updatedBy : ''}` : t('notAssessedYet');
}

function render(): void { if (view === 'audit' && cur) renderAudit(); else if (view === 'home') renderHome(); else renderList(); }

// ---------- writes ----------
async function ensureName(): Promise<void> {
  if (getMe()) return;
  const n = await promptDialog(t('yourName'), t('yourName'), '', t('yourNameHint'));
  if (n !== null) setMe(n);
}
async function save(id: string, patch: Partial<{ status: Status; owner: string; note: string }>): Promise<void> {
  if (!cur || isClosed()) return;
  await ensureName();
  const x = cur.A[id] || { status: '' as Status, owner: '', note: '', updatedAt: 0, updatedBy: '' };
  cur.A[id] = { ...x, ...patch, updatedAt: Date.now(), updatedBy: getMe() };
  cur.updatedAt = Date.now();
  if (!saveAudit(cur)) toast(t('storageWarn'));
  refreshAudit();
}

async function openReq(id: string | null): Promise<void> {
  if (noteDirty && id !== S.req && !(await confirmDialog(t('unsaved'), t('discardNotes'), t('discard')))) return;
  S.req = id;
  if (tab !== 'req') { setTab('req'); } else { document.querySelector('.reqgrid')?.classList.toggle('has-sel', !!id); buildDetail(); refreshAudit(); }
  if (id && window.innerWidth < 1000) window.scrollTo({ top: 0 });
}
/** Filters the requirement list and switches to it (used by the control map and the summary). */
function showReqs(f: Partial<{ ctl: typeof S.ctl; dom: string; st: string }>): void {
  Object.assign(S, { ctl: null, dom: '', st: '*', q: '', req: null }, f);
  setTab('req');
}

async function auditForm(a: Audit | null): Promise<void> {
  const v = a || { subject: '', date: today(), lead: getMe(), location: '', scope: '' };
  const r = await dialog({
    title: a ? t('editAudit') : t('newAudit'),
    html: `<label class="fl" for="fS">${esc(t('subject'))} *</label><input id="fS" type="text" value="${esc(v.subject)}" placeholder="${esc(t('subjectHint'))}" autocomplete="off">
      <label class="fl" for="fD">${esc(t('date'))}</label><input id="fD" type="date" value="${esc(v.date)}">
      <label class="fl" for="fL">${esc(t('lead'))}</label><input id="fL" type="text" value="${esc(v.lead)}" placeholder="${esc(t('leadHint'))}" autocomplete="off">
      <label class="fl" for="fP">${esc(t('location'))}</label><input id="fP" type="text" value="${esc(v.location)}" placeholder="${esc(t('locationHint'))}" autocomplete="off">
      <label class="fl" for="fC">${esc(t('scope'))}</label><textarea id="fC" placeholder="${esc(t('scopeHint'))}">${esc(v.scope)}</textarea>
      <p class="err" id="fErr" hidden></p>`,
    buttons: [{ label: t('cancel'), kind: 'ghost', value: '' }, { label: t('save'), kind: 'primary', value: 'ok' }],
    validate: (_v, root) => {
      const ok = !!(root.querySelector('#fS') as HTMLInputElement).value.trim();
      const e = root.querySelector('#fErr') as HTMLElement; e.textContent = t('subjectRequired'); e.hidden = ok;
      return ok;
    },
  });
  if (r.value !== 'ok') return;
  const g = (id: string) => (r.root.querySelector(id) as HTMLInputElement).value;
  const meta = { subject: g('#fS').trim(), date: g('#fD'), lead: g('#fL').trim(), location: g('#fP').trim(), scope: g('#fC') };
  if (a) { Object.assign(a, meta, { updatedAt: Date.now() }); saveAudit(a); cur = a; }
  else { cur = newAudit(meta); Object.assign(S, { ctl: null, dom: '', st: '*', q: '', req: null }); tab = 'req'; }
  view = 'audit'; render();
}

async function reportsDialog(a: Audit, title: string, lead: string): Promise<void> {
  const busy = document.createElement('div');
  busy.className = 'modal'; busy.innerHTML = `<div class="modal-card"><p class="busy">${esc(t('generating'))}</p></div>`;
  document.body.appendChild(busy);
  let pdf: Blob, xlsx: Uint8Array;
  try { xlsx = buildWorkbook(a); pdf = await buildPdf(a); }
  catch (e) { busy.remove(); await messageDialog(title, String((e as Error).message || e)); return; }
  busy.remove();
  const pdfName = reportName(a, 'pdf'), xlsxName = reportName(a, 'xlsx');
  await dialog({
    title,
    html: `<p>${esc(lead)}</p><div class="dlfiles">
      <button type="button" class="btn primary" data-dl="pdf">${esc(t('savePdf'))}<small>${esc(pdfName)}</small></button>
      <button type="button" class="btn primary" data-dl="xlsx">${esc(t('saveXlsx'))}<small>${esc(xlsxName)}</small></button></div>`,
    buttons: [{ label: t('close'), kind: 'ghost', value: 'x' }],
    onOpen: (root) => root.addEventListener('click', async (e) => {
      const b = (e.target as HTMLElement).closest('[data-dl]') as HTMLElement | null;
      if (!b) return;
      const ok = b.dataset.dl === 'pdf' ? await saveFile(pdf, pdfName, MIME.pdf) : await saveFile(xlsx, xlsxName, MIME.xlsx);
      if (ok) b.classList.add('done');
    }),
  });
}

async function toggleAudit(): Promise<void> {
  const a = cur!;
  if (a.status === 'closed') { a.status = 'open'; a.closedAt = undefined; a.updatedAt = Date.now(); saveAudit(a); render(); return; }
  const c = counts(a);
  const warn = c[''] ? ' ' + t('notAssessedWarn', { n: c[''] }) : '';
  if (!(await confirmDialog(t('closeConfirmTitle'), t('closeConfirm') + warn, t('closeAudit')))) return;
  a.status = 'closed'; a.closedAt = Date.now(); a.updatedAt = Date.now(); saveAudit(a);
  S.req = null; tab = 'sum'; render();
  await reportsDialog(a, t('closeConfirmTitle'), t('closedDone'));
}

async function importInto(): Promise<void> {
  const f = await pickFile('.xlsx,.csv');
  if (!f || !cur) return;
  if (f.size > MAX_IMPORT) { await messageDialog(t('importFailed'), t('tooLarge')); return; }
  try {
    const rows = /\.csv$/i.test(f.name) ? readCsv(await f.text()) : await readXlsx(await f.arrayBuffer());
    const res = mergeRows(cur.A, rows, getMe(), isReqId);
    if (res.subject && !cur.subject) cur.subject = res.subject;
    cur.updatedAt = Date.now(); saveAudit(cur);
    const parts = [t('imported', { n: res.taken })];
    if (res.kept) parts.push(t('importKept', { n: res.kept }));
    if (res.bad) parts.push(t('importBadStatus', { n: res.bad }));
    if (res.unknown.length) parts.push(`${t('importUnknown')}: ${res.unknown.slice(0, 5).join(', ')}`);
    render(); toast(parts.join(', '));
  } catch (e) {
    const m = (e as Error).message === 'cols' ? t('importNeedCols') : String((e as Error).message || e);
    await messageDialog(t('importFailed'), m);
  }
}

async function backupDialog(): Promise<void> {
  const r = await dialog({
    title: t('backup'), html: `<p>${esc(t('backupNote'))}</p>`,
    buttons: [{ label: t('close'), kind: 'ghost', value: '' }, { label: t('backupImport'), value: 'imp' }, { label: t('backupExport'), kind: 'primary', value: 'exp' }],
  });
  if (r.value === 'exp') {
    await saveFile(new Blob([JSON.stringify(makeBackup(), null, 1)], { type: MIME.json }), `${today()}_PhySec_Audit_backup.json`, MIME.json);
  } else if (r.value === 'imp') {
    const f = await pickFile('.json,application/json');
    if (!f) return;
    if (f.size > MAX_BACKUP) { await messageDialog(t('backup'), t('tooLarge')); return; }
    try { const res = restoreBackup(JSON.parse(await f.text())); render(); toast(t('backupDone', { n: res.added, u: res.updated })); }
    catch { await messageDialog(t('backup'), t('backupBad')); }
  }
}

// ---------- events ----------
document.addEventListener('click', async (e) => {
  const el = e.target as HTMLElement;
  if (el.closest('.modal')) return;
  const tgt = el.closest('button,tr.row') as HTMLElement | null;
  if (!tgt) return;
  const act = tgt.dataset.act;
  if (act === 'lang') { setLang(getLang() === 'hu' ? 'en' : 'hu'); render(); return; }
  if (act === 'me') { const n = await promptDialog(t('yourName'), t('yourName'), getMe(), t('yourNameHint')); if (n !== null) { setMe(n); render(); } return; }
  if (act === 'backup') { await backupDialog(); return; }
  if (act === 'home') { if (noteDirty && !(await confirmDialog(t('unsaved'), t('discardNotes'), t('discard')))) return; noteDirty = false; view = 'home'; render(); window.scrollTo(0, 0); return; }
  if (act === 'start') { try { localStorage.setItem('psa.intro', '1'); } catch { /* ignore */ } view = cur ? 'audit' : 'list'; render(); window.scrollTo(0, 0); return; }
  if (act === 'new') { await auditForm(null); return; }
  if (tgt.dataset.open) { cur = getAudit(tgt.dataset.open); Object.assign(S, { ctl: null, dom: '', st: '*', q: '', req: null }); tab = cur?.status === 'closed' ? 'sum' : 'req'; view = 'audit'; render(); window.scrollTo(0, 0); return; }
  if (tgt.dataset.lst !== undefined) { L.st = tgt.dataset.lst as typeof L.st; renderList(); return; }
  if (!cur) return;
  if (act === 'back') { view = 'list'; cur = null; render(); return; }
  if (act === 'edit') { await auditForm(cur); return; }
  if (act === 'import') { await importInto(); return; }
  if (act === 'reports') { await reportsDialog(cur, t('reports'), t('reportsReady')); return; }
  if (act === 'toggle') { await toggleAudit(); return; }
  if (act === 'delete') {
    if (await confirmDialog(t('deleteTitle'), t('deleteConfirm', { s: cur.subject }), t('delete'), true)) { deleteAudit(cur.id); cur = null; view = 'list'; render(); toast(t('deleted')); }
    return;
  }
  if (tgt.dataset.tab) { setTab(tgt.dataset.tab as Tab); return; }
  if (tgt.matches('.kpi')) { showReqs({ st: tgt.dataset.st! }); return; }
  if (tgt.matches('.drow')) { showReqs({ dom: tgt.dataset.dom! }); return; }
  if (tgt.dataset.find) { Object.assign(S, { ctl: null, dom: '', st: '*', q: '' }); await openReq(tgt.dataset.find); return; }
  if (tgt.matches('.tab')) { S.fw = tgt.dataset.fw as FwKey; refreshAudit(); return; }
  if (tgt.dataset.ctl) {
    const [fw, ...rest] = tgt.dataset.ctl.split(':');
    S.fw = fw as FwKey;
    showReqs({ ctl: { fw: fw as FwKey, id: rest.join(':') } });
    return;
  }
  if (act === 'clrCtl') { S.ctl = null; refreshAudit(); return; }
  if (act === 'closeDetail') { await openReq(null); return; }
  if (act === 'nextReq') {
    const ids = filtered().map((r) => r.id); const i2 = ids.indexOf(S.req!);
    const next = ids[i2 + 1] || D.reqs[D.reqs.findIndex((r) => r.id === S.req) + 1]?.id;
    if (next) await openReq(next); else toast(t('lastReq'));
    return;
  }
  if (tgt.matches('.sbtn')) { await save(S.req!, { status: tgt.dataset.set as Status }); return; }
  if (tgt.id === 'saveNote') { const v = ($('dNote') as HTMLTextAreaElement).value; noteDirty = false; await save(S.req!, { note: v }); toast(t('notesSaved')); return; }
  if (tgt.id === 'ownMe') { await save(S.req!, { owner: getMe() }); return; }
  if (tgt.id === 'ownClr') { await save(S.req!, { owner: '' }); return; }
  if (tgt.matches('tr.row')) { if (el.closest('select')) return; await openReq(tgt.dataset.req!); return; }
  if (tgt.dataset.req) { await openReq(tgt.dataset.req); }
});

document.addEventListener('change', async (e) => {
  const el = e.target as HTMLInputElement;
  if (el.closest('.modal')) return;
  if (el.matches('select.st')) { await save(el.dataset.req!, { status: el.value as Status }); return; }
  if (el.id === 'fDom') { S.dom = el.value; refreshAudit(); }
  if (el.id === 'fSt') { S.st = el.value; refreshAudit(); }
  if (el.id === 'ownIn' && S.req) { const v = el.value.trim(); if (v !== (cur?.A[S.req]?.owner || '')) await save(S.req, { owner: v }); }
});
document.addEventListener('keydown', (e) => { if ((e.target as HTMLElement).id === 'ownIn' && e.key === 'Enter') (e.target as HTMLElement).blur(); });
document.addEventListener('input', (e) => {
  const el = e.target as HTMLInputElement;
  if (el.id === 'q') { S.q = el.value; refreshAudit(); el.focus(); }
  if (el.id === 'lq') { L.q = el.value; const pos = el.selectionStart; renderList(); const n = $('lq') as HTMLInputElement; n.focus(); n.setSelectionRange(pos, pos); }
  if (el.id === 'dNote') { noteDirty = true; $('dMeta').textContent = t('unsaved'); }
});
window.addEventListener('beforeunload', (e) => { if (noteDirty) { e.preventDefault(); e.returnValue = ''; } });

render();
setInterval(() => { if (view === 'audit' && cur && document.visibilityState === 'visible' && !noteDirty) { const act = document.getElementById('act'); if (act && !document.activeElement?.closest('#detail')) refreshAudit(); } }, 60000);
