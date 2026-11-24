# Graph Report - Haftalik rejam  (2026-11-25)

## Corpus Check
- 24 files · ~13,310 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 317 nodes · 552 edges · 18 communities (13 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Ilova App.js: UI va qo'shish oynasi
- Sayt app.js (veb-mijoz)
- Server bog'liqliklari (pg, PGlite)
- Joylashtirish va xizmatlar (Neon, Render)
- Ilova package.json
- PROGRESS.md va README
- Ilova holati va kamchiliklar
- Bot va jadval mantig'i
- Server package.json
- Expo app.json sozlamalari
- Hafta ko'rinishi va vaqt yordamchilari
- Yo'l xaritasi (REJA)
- AGENTS.md (Expo)
- Eski so'rov: 1-2 qadam
- Eski so'rov: 3-5 qadam
- Eski so'rov: APK va bot sinovi
- Eski so'rov: PostgreSQL
- Bozor tahlili

## God Nodes (most connected - your core abstractions)
1. `App()` - 22 edges
2. `Haftalik rejam: yakuniy reja (Variant B, ikki qatlamli eslatma)` - 12 edges
3. `viewBugun()` - 12 edges
4. `Server + Telegram bot (Node + grammY)` - 11 edges
5. `dateStr()` - 10 edges
6. `createApi()` - 10 edges
7. `AddSheet()` - 9 edges
8. `loadSession()` - 9 edges
9. `Android app (Expo + React Native + notifee)` - 9 edges
10. `WeekView()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Hosting choice (free tier sleeps; VPS fallback)` --semantically_similar_to--> `Render Free hosting (Docker)`  [INFERRED] [semantically similar]
  REJA.md → PROGRESS.md
- `Server + bot setup steps` --conceptually_related_to--> `Server + Telegram bot (Node + grammY)`  [INFERRED]
  README.md → PROGRESS.md
- `server/Dockerfile deploy (persistent /data volume)` --conceptually_related_to--> `Render Free hosting (Docker)`  [INFERRED]
  README.md → PROGRESS.md
- `EAS cloud APK build` --references--> `Android app (Expo + React Native + notifee)`  [INFERRED]
  README.md → PROGRESS.md
- `App()` --calls--> `dateStr()`  [EXTRACTED]
  app/App.js → app/src/time.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Reminder delivery flow (app notification + bot message + answer sync)** — progress_notifee, progress_scheduler, progress_api, progress_server_bot [INFERRED 0.85]
- **Deployment stack (GitHub, Render, Neon, UptimeRobot)** — progress_github, progress_render, progress_neon, progress_uptimerobot [EXTRACTED 1.00]
- **APK build constraints** — progress_gotcha_apk_path, progress_gotcha_r8, progress_gotcha_emulator, progress_apk [EXTRACTED 1.00]

## Communities (18 total, 5 thin omitted)

### Community 0 - "Ilova App.js: UI va qo'shish oynasi"
Cohesion: 0.09
Nodes (54): AddSheet(), App(), Btn(), C, DAYS, DURATIONS, fmt(), HEADS (+46 more)

### Community 1 - "Sayt app.js (veb-mijoz)"
Cohesion: 0.12
Nodes (32): addDays(), addForm(), answers(), api(), bestStreak(), byDate(), esc(), fromUtc() (+24 more)

### Community 2 - "Server bog'liqliklari (pg, PGlite)"
Cohesion: 0.09
Nodes (18): n, src, authed(), createApi(), json(), MIME, PUBLIC, readJson() (+10 more)

### Community 3 - "Joylashtirish va xizmatlar (Neon, Render)"
Cohesion: 0.09
Nodes (23): Defect: bot 'Keyinroq' writes nothing, Defect: /ochir deletes only today's tasks, Defect: weekly report not sent automatically on Sunday, GitHub repo haftalik_rejam (auto-deploy on push to main), Gotcha: never source .env (use node --env-file), Gotcha: Render free sleeps without UptimeRobot, Neon PostgreSQL, PGlite integration tests (9 passing) (+15 more)

### Community 4 - "Ilova package.json"
Cohesion: 0.11
Nodes (21): dependencies, expo@~58.0.26, expo-status-bar@~58.0.5, @notifee/react-native@^9.1.8, react@19.3.0, react-native@0.88.1, @react-native-async-storage/async-storage@2.2.0, main (+13 more)

### Community 5 - "PROGRESS.md va README"
Cohesion: 0.09
Nodes (19): Eslatmalar, Ish jurnali (oxirgi yangilanish: 2026-11-25), Keyingi chatda davom etish (Neon), Tayyor, Haftalik rejam, Ilova (`app/`), Server + bot (`server/`), 10. Birinchi 7 kunda 5 qadam (+11 more)

### Community 6 - "Ilova holati va kamchiliklar"
Cohesion: 0.10
Nodes (22): Android app (Expo + React Native + notifee), HTTP API (/api/tasks, /api/state), APK dist/haftalik-rejam.apk (arm64, ~26 MB), Defect: app silently swallows 401 (should say reconnect), Defect: no task editing in app or site, Defect: bot reply does not cancel app notifications until next sync, Defect: invalid queued action (400) may stay forever, Gotcha: APK build only works in C:\hr\app (no spaces) (+14 more)

### Community 7 - "Bot va jadval mantig'i"
Cohesion: 0.24
Nodes (15): createBot(), dueEvents(), FOLLOWUP_AFTER_MIN, isActiveOn(), localParts(), parseQuickAdd(), REMIND_BEFORE_MIN, streak() (+7 more)

### Community 8 - "Server package.json"
Cohesion: 0.13
Nodes (17): @electric-sql/pglite, grammy, pg, dependencies, grammy@^1.30.0, pg@^8.23.1, devDependencies, @electric-sql/pglite@^0.6.0 (+9 more)

### Community 9 - "Expo app.json sozlamalari"
Cohesion: 0.12
Nodes (15): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, expo (+7 more)

### Community 10 - "Hafta ko'rinishi va vaqt yordamchilari"
Cohesion: 0.25
Nodes (13): addDays(), Garden(), mondayOf(), prettyDay(), Today(), WeekView(), atTime(), dateStr() (+5 more)

### Community 11 - "Yo'l xaritasi (REJA)"
Cohesion: 0.29
Nodes (7): TODO later: Uzbek voice input, weekly report in bot, Play Market, Roadmap milestones 30/90/180 days, Monetization model (premium ~1-2$/month, assumption), Open questions (old bot, configurable 15 min, voice service, iPhone), Play Market release (section 8), Future versions v1.1, v1.2, v2, Uzbek voice input (unverified recognition quality)

### Community 12 - "AGENTS.md (Expo)"
Cohesion: 0.33
Nodes (5): Building with EAS, Commands, Expo has changed — do not trust your training data, Navigation & Routing, Rules

## Knowledge Gaps
- **27 isolated node(s):** `Scheduler (15 min reminder, end-of-task poll, 5 min repeat)`, `PGlite integration tests (9 passing)`, `GitHub repo haftalik_rejam (auto-deploy on push to main)`, `Defect: bot reply does not cancel app notifications until next sync`, `Defect: bot 'Keyinroq' writes nothing` (+22 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 128 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Server + Telegram bot (Node + grammY)` connect `Joylashtirish va xizmatlar (Neon, Render)` to `Ilova holati va kamchiliklar`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Server + Telegram bot (Node + grammY)` (e.g. with `6-digit pairing code from bot` and `Server + bot setup steps`) actually correct?**
  _`Server + Telegram bot (Node + grammY)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Scheduler (15 min reminder, end-of-task poll, 5 min repeat)`, `PGlite integration tests (9 passing)`, `GitHub repo haftalik_rejam (auto-deploy on push to main)` to the rest of the system?**
  _27 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Ilova App.js: UI va qo'shish oynasi` be split into smaller, more focused modules?**
  _Cohesion score 0.08633879781420765 - nodes in this community are weakly interconnected._
- **Why does `HTTP API (/api/tasks, /api/state)` connect `Ilova holati va kamchiliklar` to `Joylashtirish va xizmatlar (Neon, Render)`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Should `Sayt app.js (veb-mijoz)` be split into smaller, more focused modules?**
  _Cohesion score 0.11587301587301588 - nodes in this community are weakly interconnected._
- **Should `Server bog'liqliklari (pg, PGlite)` be split into smaller, more focused modules?**
  _Cohesion score 0.09411764705882353 - nodes in this community are weakly interconnected._