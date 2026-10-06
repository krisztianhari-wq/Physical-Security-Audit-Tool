# PhySec Audit – fejlesztői jegyzet

Fizikai biztonsági audit eszköz (85 követelmény × ISO 27001 / 27002 / NIST 800-53 / ASIS), sadrobot arculattal: PWA + Tauri v2 macOS/Windows/Android. Felhasználói leírás: README.md.

## Indítás és teszt
- A `.node` symlink a BTT Dive Planner projekt Node-jára mutat: `export PATH="$PWD/.node/bin:$HOME/.cargo/bin:$PATH"`.
- Dev: launch config `physec-audit` (a projekt `.claude/launch.json`-jában és a `~/Claude_code/.claude/launch.json`-ban is) → `npx vite --port 5177 --strictPort`.
- Teszt: `npm test` (katalógus, munkafüzet, import-merge, ellenséges bemenet); utána `python3 scripts/check-xlsx.py` (openpyxl) ellenőrzi a `tests/out/sample.xlsx`-et. Build: `npm run build` → `dist/`.
- Desktop helyben: `npx tauri build --bundles dmg` – a `.app`-ot kiveszi a `bundle/macos`-ból; telepítés a DMG felcsatolásával és `ditto`-val az `/Applications`-be.
- Android helyben: `npx tauri android init` (a `gen` gitignore-olt) → `android:allowBackup="false"` a manifestbe → `bash scripts/gen-icons.sh` → `npx tauri android build --apk --target aarch64` → `VERSION=vX.Y.Z bash scripts/sign-apk.sh` (keystore env-vel, lásd CLAUDE.local.md) → `adb install -r`.

## Felépítés
- `data/requirements.json` – követelménykatalógus (egyetlen igazságforrás, publikus).
- `src/store.ts` – több audit localStorage-ban (`psa.audits` index + `psa.audit.<id>`), JSON mentés/visszaállítás, `isReqId`. `src/main.ts` – UI (három fül: Követelmények / Kontrolltérkép / Összegzés; lezárt audit az Összegzésen, csak olvasható), import méretkorlátok.
- `src/report.ts` – PDF (html-to-image + jsPDF, A4 fekvő, összegzés + minden követelmény, DOM-ban lapozva). `src/xlsx.ts` – könyvtár nélküli xlsx író/olvasó, 2 lap (1. lap = az eredeti 15 oszlopos csereformátum).
- `src/platform.ts` – mentés: iOS share sheet, Android/desktop Tauri dialog+fs, weben letöltés. `src/i18n.ts` – HU/EN.
- `src-tauri/` – a BTT-ből átvett váz: vendorolt tao 0.35.3 patch, Cargo.lock.

## Telepítés / kiadás
- Push `main`-re → `pages.yml` → https://krisztianhari-wq.github.io/Physical-Security-Audit-Tool/
- `v*` tag → `release.yml`: macOS/Windows installerek + aláírt Android APK, nem draft release; a CI patcheli az `allowBackup=false`-t.
- Verzió: `package.json` + `src-tauri/tauri.conf.json` + `Cargo.toml` együtt – lásd /release skill. Commit a repo-szintű sadrobot noreply identitással.

## Döntések
1. Teljesen publikus, a katalógussal együtt (a tulajdonos döntése). Nincs szerver, fiók, analitika: minden adat az eszközön.
2. Vanilla TS, nincs React (a BTT-vel ellentétben).
3. iOS = PWA (nincs Apple Developer fiók).
4. Licenc: 8451cbe óta saját, minden jog fenntartva (EN+HU, a BTT-vel azonos feltételek); jogi sor az app és a PDF láblécében. A v0.1.2-ig kiadott buildek metaadata még MIT-et mond.
5. Biztonság (2026-09-27): saját-property REQ ellenőrzés (`isReqId`, `__proto__` ellen), szigorú audit id regex, import méretkorlát, csak buildben CSP meta + frame guard, Android `allowBackup=false`.

## Buktatók
- Az npm `@tauri-apps/*` `~2.11`-re van rögzítve, hogy egyezzen a Rust tauri 2.11.x-szel – eltérésnél a `tauri build` leáll.
- A v0.1.0 újrafuttatásánál az APK csatolása elbukott („Resource not accessible by integration”); a v0.1.1-ben megvan – figyelmen kívül hagyható.

## Nyitott
- Felajánlva, nem kész: titkosított mentés, SHA-ra rögzített Actions, kódaláírás.
