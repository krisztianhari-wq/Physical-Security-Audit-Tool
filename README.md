# PhySec Audit

Fizikai biztonsági audit eszköz · Physical security audit tool — **sadrobot**

85 fizikai biztonsági követelmény 10 doménben, hozzárendelve az **ISO 27001** klauzuláihoz, az **ISO 27002 / Annex A** kontrolljaihoz, a **NIST SP 800-53 r5**-höz és az **ASIS PAP-2021**-hez. Minden audit végén PDF-jelentés és Excel-táblázat készül, amelyet a felhasználó a saját gépére menthet.

**Web / PWA:** https://krisztianhari-wq.github.io/Physical-Security-Audit-Tool/
**Telepítők (Mac, Windows, Android):** [Releases](https://github.com/krisztianhari-wq/Physical-Security-Audit-Tool/releases)

## Magyarul

### Mit tud

- **Több audit:** auditlista keresővel és szűrővel (folyamatban / lezárt). Minden audit megmarad, a korábbiak eredménye bármikor visszanézhető.
- **Értékelés:** követelményenként állapot (megfelelő, részben megfelelő, nem megfelelő, nem alkalmazható), felelős és bizonyíték / megállapítás. Az app naplózza, ki és mikor módosított.
- **Áttekintés:** összesítő KPI-k, doménenkénti bontás, kontrolltérkép a négy szabvány szerint (a csempe színe a hozzárendelt követelmények legrosszabb állapota), szűrés és keresés (ID, szöveg, kontrollazonosító, pl. `PE-3`, `A.7.4`, `PAP-IDS`).
- **Audit lezárása:** lezáráskor az app elkészíti a jelentéseket:
  - **PDF-jelentés** (A4 fekvő): összesítő oldal KPI-kkal, doménbontással és megállapításokkal, utána az összes követelmény táblázatosan.
  - **Excel-táblázat** két munkalappal: *Assessment* (85 követelmény a kitöltéssel, a szabványhozzárendelésekkel) és *Summary* (audit adatai, összesítők).
- **Import:** Excel/CSV visszaolvasása összefésüléssel (az újabb bejegyzés nyer; az Excelben közvetlenül szerkesztett sorokat átveszi).
- **Mentés és visszatöltés:** minden audit egyetlen JSON-fájlba menthető, és másik eszközön visszatölthető.
- **Magyar és angol felület**, világos és sötét mód, telefonon és asztali gépen is.

### Adatvédelem

Minden adat **csak az eszközön** tárolódik (böngésző / app helyi tárolója). Nincs szerver, fiók, analitika vagy hálózati forgalom. A böngészőadatok törlése az auditokat is törli, ezért rendszeresen készíts mentést (*Mentés és visszatöltés*).

### Platformok

| Platform | Hogyan |
|---|---|
| **Web** | A fenti link bármely modern böngészőben. Offline is működik (PWA). |
| **Windows** | `*-setup.exe` vagy `*.msi` a Releases oldalról. SmartScreen: *További információ → Futtatás mindenképp*. |
| **macOS** | `*_universal.dmg`. Az app nincs Apple-tanúsítvánnyal aláírva: az Alkalmazások mappába húzás után egyszer futtasd: `xattr -cr "/Applications/PhySec Audit.app"`. |
| **Android** | `*.apk` a Releases oldalról (ismeretlen forrásból való telepítés engedélyezése szükséges). |
| **iOS / iPadOS** | Safari → a webes link → *Megosztás → Főképernyőhöz adás*. App Store-verzióhoz Apple Developer fiók kell; a projekt iOS-re is fordítható (`npx tauri ios build`). |

A jelentések mentése: asztali gépen mentési párbeszédablak, iOS-en a megosztási lap (Fájlok, AirDrop, Mail), Androidon a rendszer mentési ablaka, böngészőben letöltés.

## English

### Features

- **Multiple audits** with search and status filter; earlier audits stay available for review.
- **Assessment** per requirement: status, owner, evidence / findings, with who and when.
- **Overview:** KPIs, per-domain breakdown, control map for the four frameworks (tile colour = worst status of the mapped requirements), filters and search.
- **Closing an audit** creates a **PDF report** (A4 landscape: summary page, then every requirement) and an **Excel workbook** (*Assessment* + *Summary* sheets) to save on the device.
- **Import** Excel/CSV with a merge (newer entry wins, rows edited directly in Excel are taken over). **Backup/restore** of all audits as JSON.
- Hungarian and English UI, light and dark mode, phone to desktop.

**Privacy:** all data stays on the device. No server, account, analytics or network traffic.

## Fejlesztés · Development

```bash
npm ci
npm run dev          # http://localhost:5173
npm test             # unit tests (catalogue, workbook, import merge)
npm run build        # web build → dist/
npx tauri build      # desktop app (Rust toolchain needed)
npx tauri android init && npx tauri android build --apk --target aarch64
npx tauri ios init && npx tauri ios build
```

- `data/requirements.json` – the requirement catalogue (single source of truth).
- `src/` – TypeScript UI (no framework): `store.ts` (audits in localStorage), `xlsx.ts` (library-free .xlsx writer/reader), `report.ts` (PDF via html-to-image + jsPDF), `platform.ts` (saving files on every platform).
- `src-tauri/` – Tauri v2 shell for macOS, Windows, iOS and Android.
- CI: `pages.yml` deploys the PWA on every push to `main`; `release.yml` builds the macOS, Windows and Android installers on `v*` tags.

## Licenc · License

MIT © 2026 sadrobot
