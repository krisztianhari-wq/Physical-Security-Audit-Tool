// UI strings (Hungarian default, English). Requirement texts and control titles stay in English.
export type Lang = 'hu' | 'en';

const HU = {
  appName: 'PhySec Audit',
  appTag: 'Fizikai biztonsági audit',
  audits: 'Auditok',
  auditsSub: 'Nyiss meg egy auditot a folytatáshoz, vagy nézd meg egy korábbi audit eredményét.',
  newAudit: 'Új audit',
  search: 'Keresés: tárgy, vezető auditor, helyszín',
  all: 'Összes', open: 'Folyamatban', closed: 'Lezárt',
  noAudits: 'Még nincs audit ezen az eszközön. Hozz létre egyet, és a követelményeken lépésről lépésre végigvezet az app.',
  noMatch: 'Nincs találat.',
  assessed: 'értékelve', of: '/',
  lastChange: 'Utolsó módosítás',
  subject: 'Vizsgálat tárgya', date: 'Audit dátuma', lead: 'Vezető auditor', location: 'Helyszín', scope: 'Hatókör és megjegyzések',
  subjectHint: 'Például: budaörsi adatközpont, éves audit', leadHint: 'A vezető auditor neve', locationHint: 'Épület, telephely vagy adatközpont',
  scopeHint: 'Mi tartozik a hatókörbe, auditcsapat, hivatkozott dokumentumok',
  subjectRequired: 'A vizsgálat tárgya kötelező.',
  save: 'Mentés', cancel: 'Mégse', close: 'Bezárás', delete: 'Törlés', ok: 'Rendben',
  editAudit: 'Audit adatainak szerkesztése', backToList: 'Vissza az auditokhoz', edit: 'Adatok szerkesztése',
  closeAudit: 'Audit lezárása', reopen: 'Újranyitás', deleteAudit: 'Audit törlése', reports: 'Jelentések',
  pdfReport: 'PDF-jelentés', xlsxReport: 'Excel-táblázat', importXlsx: 'Excel/CSV importálása',
  closedBanner: 'Ez az audit le van zárva, az értékelés csak olvasható. Módosításhoz nyisd újra.',
  closeConfirmTitle: 'Audit lezárása',
  closeConfirm: 'Lezárás után az értékelés csak olvasható lesz (később újranyitható). Az app elkészíti a PDF-jelentést és az Excel-táblázatot, amelyeket a gépedre menthetsz.',
  notAssessedWarn: 'Még {n} követelmény nincs értékelve.',
  closedDone: 'Az audit lezárva. Mentsd el a jelentéseket:',
  reportsReady: 'A jelentések elkészültek:',
  savePdf: 'PDF mentése', saveXlsx: 'Táblázat mentése',
  generating: 'Jelentések készítése…',
  deleteTitle: 'Audit törlése',
  deleteConfirm: 'A(z) „{s}” audit és minden értékelése véglegesen törlődik erről az eszközről. Ha később szükséged lehet rá, előbb készíts mentést.',
  deleted: 'Az audit törölve.',
  yourName: 'A neved',
  yourNameHint: 'Ez kerül a módosításaid mellé („módosította”).',
  setName: 'Név megadása', you: 'Te',
  summary: 'Összesítés', progress: 'Értékelési haladás', reqsAssessed: 'követelmény értékelve',
  byDomain: 'Doménenként', byDomainHint: 'Kattints egy doménre a szűréshez',
  controlMap: 'Kontrolltérkép', controlMapHint: 'A csempe színe a hozzárendelt követelmények legrosszabb állapota. Kattints a szűréshez.',
  requirements: 'Követelmények', searchReqs: 'Keresés: ID, szöveg, kontroll (PE-3, A.7.4, PAP-IDS), felelős, bizonyíték',
  allDomains: 'Minden domén', allStatuses: 'Minden állapot', shown: 'látható', noReqMatch: 'Nincs a szűrőknek megfelelő követelmény.',
  controlFilter: 'Kontrollszűrő', clear: 'Törlés',
  details: 'Részletek', selectPrompt: 'Válassz egy követelményt vagy egy kontrollt a térképen.',
  status: 'Állapot', owner: 'Felelős', ownerHint: 'A felelős személy neve', assignMe: 'Hozzám rendelés', remove: 'Eltávolítás',
  evidence: 'Bizonyíték és megállapítások', evidenceHint: 'Átvizsgált bizonyítékok, interjújegyzetek, megállapítás-hivatkozás',
  saveNotes: 'Jegyzet mentése', notesSaved: 'Jegyzet mentve', unsaved: 'Mentetlen jegyzet',
  coverageNote: 'Lefedettségi megjegyzés', mappedControls: 'Hozzárendelt kontrollok', noDirect: 'Nincs közvetlen kontroll',
  mappedReqs: 'Hozzárendelt követelmények', relatedControls: 'Kapcsolódó kontrollok (közös követelmények)',
  notAssessedYet: 'Még nincs értékelve', updated: 'Módosítva', by: '·',
  recent: 'Legutóbbi módosítások', noActivity: 'Még nincs értékelés.',
  findings: 'Megállapítások', findingsSub: 'Nem megfelelő és részben megfelelő követelmények, a legsúlyosabbal kezdve', noFindings: 'Nincs nem megfelelő vagy részben megfelelő követelmény.',
  backup: 'Mentés és visszatöltés', backupExport: 'Minden audit mentése (JSON)', backupImport: 'Mentés visszatöltése',
  backupNote: 'Az auditok ezen az eszközön, a böngészőben vagy az appban tárolódnak. Rendszeresen készíts mentést, és azt másik gépen is visszatöltheted.',
  backupDone: 'Visszatöltve: {n} új, {u} frissített audit.', backupBad: 'Ez nem PhySec Audit mentésfájl.',
  imported: 'Importálva: {n} módosítás', importKept: '{n} újabb helyi bejegyzés megmaradt', importBadStatus: '{n} sor ismeretlen állapottal kimaradt',
  importUnknown: 'ismeretlen ID-k kimaradtak', tooLarge: 'A fájl túl nagy.', importFailed: 'Az importálás nem sikerült', importNeedCols: 'Nem található „ID” és „Status” oszlop.',
  storageWarn: 'Ez a böngésző nem engedi a helyi tárolást, a munka bezáráskor elveszik. Készíts mentést.',
  lang: 'English', confidential: 'Confidential', generated: 'Készült', page: 'oldal',
  reportTitle: 'Fizikai biztonsági auditjelentés', allReqs: 'Minden követelmény', moreInApp: 'további az appban',
  colReq: 'Követelmény', colControls: 'Kontrollok',
  statusLabel: 'Állapot', auditStatus: 'Audit állapota', closedAt: 'Lezárva',
  homeTitle: 'Nyitóoldal', homeLead: 'Egyszerű eszköz fizikai biztonsági auditokhoz. 85 követelményen vezet végig (őrzés, beléptetés, kamerák, tűz- és vízvédelem, személyzet, alvállalkozók, hoszting…), és megmutatja, hogyan állsz az ISO 27001, ISO 27002, NIST SP 800-53 és ASIS PAP szerint.',
  homeStart: 'Kezdés', homeContinue: 'Tovább az auditokhoz', homeHow: 'Hogyan használd?',
  homeS1: 'Hozz létre egy auditot', homeS1p: 'Add meg, mit vizsgálsz (például egy telephelyet vagy adatközpontot), mikor, és ki vezeti.',
  homeS2: 'Értékeld a követelményeket', homeS2p: 'Minden követelménynél válaszd ki: megfelelő, részben megfelelő, nem megfelelő vagy nem alkalmazható. Írd mellé a felelőst és a bizonyítékot.',
  homeS3: 'Nézd meg az eredményt', homeS3p: 'Az Összesítés és a Kontrolltérkép megmutatja, hol vannak hiányosságok, és melyik szabványt érintik.',
  homeS4: 'Zárd le az auditot', homeS4p: 'Lezáráskor az app PDF-jelentést és Excel-táblázatot készít. Ezeket a saját gépedre mentheted, és továbbküldheted.',
  homePrivacy: 'Az adataid nálad maradnak', homePrivacyP: 'Minden adat csak ezen az eszközön tárolódik: nincs fiók, nincs szerver, semmi nem megy át a hálózaton. Tipp: időnként készíts mentést a „Mentés és visszatöltés” gombbal.',
  homeMade: 'Készítette: sadrobot',
  themeAuto: 'Téma: automatikus', themeLight: 'Téma: világos', themeDark: 'Téma: sötét', themeHint: 'Váltás: automatikus (a rendszert követi) → világos → sötét',
  newAuditBig: 'Új audit indítása', newCardHint: 'Néhány adat megadása után azonnal kezdheted az értékelést.', noAuditsTitle: 'Kezdd az első auditoddal', auditsTotal: 'audit',
  help: 'Súgó', auditDetails: 'Audit adatai', backToReqs: 'Vissza a listához', partly: 'Részben értékelt', nextReq: 'Következő',
  lastReq: 'Ez volt az utolsó követelmény.', discardNotes: 'A jegyzet nincs mentve. Elveted?', discard: 'Elvetés',
  helpText: 'Hozz létre egy auditot, értékeld a követelményeket (állapot, felelős, bizonyíték), majd zárd le. Lezáráskor az app PDF-jelentést és Excel-táblázatot készít, amelyeket a gépedre menthetsz. Minden adat csak ezen az eszközön tárolódik.',
  footer: 'sadrobot · PhySec Audit',
};

type Dict = typeof HU;

const EN: Dict = {
  appName: 'PhySec Audit',
  appTag: 'Physical security audit',
  audits: 'Audits',
  auditsSub: 'Open an audit to continue it, or review the results of an earlier audit.',
  newAudit: 'New audit',
  search: 'Search subject, lead auditor, site',
  all: 'All', open: 'In progress', closed: 'Closed',
  noAudits: 'There are no audits on this device yet. Create one and the app guides you through the requirements step by step.',
  noMatch: 'No matches.',
  assessed: 'assessed', of: '/',
  lastChange: 'Last change',
  subject: 'Subject of audit', date: 'Audit date', lead: 'Lead auditor', location: 'Location / site', scope: 'Scope and notes',
  subjectHint: 'For example: Budaörs data centre, annual audit', leadHint: 'Name of the lead auditor', locationHint: 'Building, site or data centre',
  scopeHint: 'What is in scope, audit team, reference documents',
  subjectRequired: 'Subject of audit is required.',
  save: 'Save', cancel: 'Cancel', close: 'Close', delete: 'Delete', ok: 'OK',
  editAudit: 'Edit audit details', backToList: 'Back to audits', edit: 'Edit details',
  closeAudit: 'Close audit', reopen: 'Reopen', deleteAudit: 'Delete audit', reports: 'Reports',
  pdfReport: 'PDF report', xlsxReport: 'Excel workbook', importXlsx: 'Import Excel/CSV',
  closedBanner: 'This audit is closed, the assessment is read-only. Reopen it to make changes.',
  closeConfirmTitle: 'Close audit',
  closeConfirm: 'After closing, the assessment becomes read-only (it can be reopened later). The app creates the PDF report and the Excel workbook for you to save on your device.',
  notAssessedWarn: '{n} requirements are not assessed yet.',
  closedDone: 'The audit is closed. Save the reports:',
  reportsReady: 'The reports are ready:',
  savePdf: 'Save PDF', saveXlsx: 'Save workbook',
  generating: 'Creating reports…',
  deleteTitle: 'Delete audit',
  deleteConfirm: 'The audit “{s}” and all its assessments will be permanently deleted from this device. Make a backup first if you might need it.',
  deleted: 'Audit deleted.',
  yourName: 'Your name',
  yourNameHint: 'Recorded as “updated by” on your changes.',
  setName: 'Set your name', you: 'You',
  summary: 'Summary', progress: 'Assessment progress', reqsAssessed: 'requirements assessed',
  byDomain: 'By domain', byDomainHint: 'Select a domain to filter',
  controlMap: 'Control map', controlMapHint: 'Tile colour = worst status among mapped requirements. Select a tile to filter.',
  requirements: 'Requirements', searchReqs: 'Search ID, text, control (PE-3, A.7.4, PAP-IDS), owner, evidence',
  allDomains: 'All domains', allStatuses: 'All statuses', shown: 'shown', noReqMatch: 'No requirements match these filters.',
  controlFilter: 'Control filter', clear: 'Clear',
  details: 'Details', selectPrompt: 'Select a requirement, or a control in the map.',
  status: 'Status', owner: 'Owner', ownerHint: 'Name of the responsible person', assignMe: 'Assign to me', remove: 'Remove',
  evidence: 'Evidence and findings', evidenceHint: 'Evidence reviewed, interview notes, finding reference',
  saveNotes: 'Save notes', notesSaved: 'Notes saved', unsaved: 'Unsaved notes',
  coverageNote: 'Coverage note', mappedControls: 'Mapped controls', noDirect: 'No direct control',
  mappedReqs: 'Mapped requirements', relatedControls: 'Related controls (shared requirements)',
  notAssessedYet: 'Not assessed yet', updated: 'Updated', by: '·',
  recent: 'Recent activity', noActivity: 'No assessments yet.',
  findings: 'Findings', findingsSub: 'Non-compliant and partial requirements, most severe first', noFindings: 'No non-compliant or partial requirements.',
  backup: 'Backup and restore', backupExport: 'Back up all audits (JSON)', backupImport: 'Restore a backup',
  backupNote: 'Audits are stored on this device, in the browser or the app. Make regular backups; a backup can be restored on another device.',
  backupDone: 'Restored: {n} new, {u} updated audits.', backupBad: 'This is not a PhySec Audit backup file.',
  imported: 'Imported {n} updates', importKept: 'kept {n} newer local entries', importBadStatus: 'skipped {n} rows with an unknown status',
  importUnknown: 'ignored unknown IDs', tooLarge: 'The file is too large.', importFailed: 'Import failed', importNeedCols: 'Columns “ID” and “Status” were not found.',
  storageWarn: 'This browser does not allow local storage, work is lost when you close it. Make a backup.',
  lang: 'Magyar', confidential: 'Confidential', generated: 'Generated', page: 'page',
  reportTitle: 'Physical security audit report', allReqs: 'All requirements', moreInApp: 'more in the app',
  colReq: 'Requirement', colControls: 'Controls',
  statusLabel: 'Status', auditStatus: 'Audit status', closedAt: 'Closed',
  homeTitle: 'Start page', homeLead: 'A simple tool for physical security audits. It walks you through 85 requirements (guarding, access control, cameras, fire and water protection, staff, subcontractors, hosting…) and shows where you stand against ISO 27001, ISO 27002, NIST SP 800-53 and ASIS PAP.',
  homeStart: 'Get started', homeContinue: 'Go to my audits', homeHow: 'How to use it',
  homeS1: 'Create an audit', homeS1p: 'Enter what you audit (for example a site or a data centre), when, and who leads it.',
  homeS2: 'Assess the requirements', homeS2p: 'For each requirement choose compliant, partial, non-compliant or not applicable. Add the owner and the evidence.',
  homeS3: 'Review the results', homeS3p: 'The Summary and the Control map show where the gaps are and which frameworks they affect.',
  homeS4: 'Close the audit', homeS4p: 'On closing, the app creates a PDF report and an Excel workbook. Save them on your device and share them.',
  homePrivacy: 'Your data stays with you', homePrivacyP: 'Everything is stored on this device only: no account, no server, nothing goes over the network. Tip: make a backup now and then with “Backup and restore”.',
  homeMade: 'Made by sadrobot',
  themeAuto: 'Theme: auto', themeLight: 'Theme: light', themeDark: 'Theme: dark', themeHint: 'Switch: auto (follows the system) → light → dark',
  newAuditBig: 'Start a new audit', newCardHint: 'Enter a few details and start assessing right away.', noAuditsTitle: 'Start with your first audit', auditsTotal: 'audits',
  help: 'Help', auditDetails: 'Audit details', backToReqs: 'Back to list', partly: 'Partly assessed', nextReq: 'Next',
  lastReq: 'This was the last requirement.', discardNotes: 'The notes are not saved. Discard them?', discard: 'Discard',
  helpText: 'Create an audit, assess the requirements (status, owner, evidence), then close it. On closing, the app creates a PDF report and an Excel workbook that you can save on your device. All data stays on this device.',
  footer: 'sadrobot · PhySec Audit',
};

const DOM_HU: Record<string, string> = {
  GOV: 'Irányítás és kockázat', PER: 'Kerületvédelem', ACC: 'Beléptetés és hozzáférés', ENV: 'Környezeti védelem',
  SEC: 'Biztonsági személyzet', AST: 'Eszközvédelem', INC: 'Incidens- és vészhelyzet-kezelés', CHG: 'Változáskezelés',
  SUB: 'Alvállalkozók', HOS: 'Hoszting',
};

export type Status = 'c' | 'p' | 'n' | 'x' | '';
const ST_EN: Record<Status, string> = { c: 'Compliant', p: 'Partial', n: 'Non-compliant', x: 'Not applicable', '': 'Not assessed' };
const ST_HU: Record<Status, string> = { c: 'Megfelelő', p: 'Részben megfelelő', n: 'Nem megfelelő', x: 'Nem alkalmazható', '': 'Nem értékelt' };
/** English labels are the interchange format of the Excel/CSV files. */
export const ST_FILE = ST_EN;

let lang: Lang = 'hu';
try { const l = localStorage.getItem('psa.lang'); if (l === 'en' || l === 'hu') lang = l; } catch { /* storage unavailable */ }

export const getLang = (): Lang => lang;
export function setLang(l: Lang): void {
  lang = l;
  try { localStorage.setItem('psa.lang', l); } catch { /* ignore */ }
  document.documentElement.lang = l;
}
export function t(key: keyof Dict, vars: Record<string, string | number> = {}): string {
  let s = (lang === 'en' ? EN : HU)[key];
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
export const stLabel = (s: Status): string => (lang === 'en' ? ST_EN : ST_HU)[s];
export const domShort = (code: string, fallback: string): string => (lang === 'en' ? fallback : DOM_HU[code] || fallback);
export const auditStatusLabel = (s: 'open' | 'closed'): string => t(s === 'closed' ? 'closed' : 'open');
