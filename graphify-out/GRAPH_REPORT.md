# Graph Report - Haftalik rejam  (2026-11-25)

## Corpus Check
- 28 files · ~7,488 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .log 2, .example 1)

## Summary
- 196 nodes · 357 edges · 13 communities (9 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- schedule.js
- package.json
- Haftalik rejam: yakuniy reja (Variant B, ikki qatlamli eslatma)
- server/src/api.js
- App.js
- app/package.json
- expo
- time.js
- AGENTS.md
- Q: Haftalik rejam: 1-2 qadam nima qilindi?
- Q: Haftalik rejam: 3-5 qadam nima qilindi?
- Q: Haftalik rejam: APK va bot sinovi
- Q: Haftalik rejam: bazani PostgreSQL ga o'tkazish

## God Nodes (most connected - your core abstractions)
1. `App()` - 18 edges
2. `Haftalik rejam: yakuniy reja (Variant B, ikki qatlamli eslatma)` - 12 edges
3. `createApi()` - 9 edges
4. `loadSession()` - 9 edges
5. `createBot()` - 8 edges
6. `flushPending()` - 8 edges
7. `rescheduleAll()` - 8 edges
8. `loadAnswers()` - 8 edges
9. `expo` - 8 edges
10. `dueEvents()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `createApi()` --calls--> `localParts()`  [EXTRACTED]
  server/src/api.js → server/src/schedule.js
- `rescheduleAll()` --calls--> `upcomingEvents()`  [EXTRACTED]
  app/src/notify.js → app/src/time.js
- `createBot()` --calls--> `isActiveOn()`  [EXTRACTED]
  server/src/bot.js → server/src/schedule.js
- `createBot()` --calls--> `localParts()`  [EXTRACTED]
  server/src/bot.js → server/src/schedule.js
- `createBot()` --calls--> `parseQuickAdd()`  [EXTRACTED]
  server/src/bot.js → server/src/schedule.js

## Import Cycles
- None detected.

## Communities (13 total, 4 thin omitted)

### Community 0 - "schedule.js"
Cohesion: 0.21
Nodes (15): createBot(), dueEvents(), FOLLOWUP_AFTER_MIN, isActiveOn(), localParts(), parseQuickAdd(), REMIND_BEFORE_MIN, streak() (+7 more)

### Community 1 - "package.json"
Cohesion: 0.13
Nodes (15): grammy, dependencies, grammy@^1.30.0, pg@^8.23.1, devDependencies, @electric-sql/pglite@^0.6.0, engines, node (+7 more)

### Community 2 - "Haftalik rejam: yakuniy reja (Variant B, ikki qatlamli eslatma)"
Cohesion: 0.09
Nodes (19): Eslatmalar, Ish jurnali (oxirgi yangilanish: 2026-11-25), Keyingi chatda davom etish (Neon), Tayyor, Haftalik rejam, Ilova (`app/`), Server + bot (`server/`), 10. Birinchi 7 kunda 5 qadam (+11 more)

### Community 3 - "server/src/api.js"
Cohesion: 0.12
Nodes (17): @electric-sql/pglite, pg, n, src, authed(), createApi(), json(), readJson() (+9 more)

### Community 4 - "App.js"
Cohesion: 0.15
Nodes (33): App(), DAYS, s, Settings(), call(), flushPending(), login(), pullState() (+25 more)

### Community 5 - "app/package.json"
Cohesion: 0.11
Nodes (21): dependencies, expo@~58.0.26, expo-status-bar@~58.0.5, @notifee/react-native@^9.1.8, react@19.3.0, react-native@0.88.1, @react-native-async-storage/async-storage@2.2.0, main (+13 more)

### Community 6 - "expo"
Cohesion: 0.12
Nodes (15): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, expo (+7 more)

### Community 7 - "time.js"
Cohesion: 0.32
Nodes (11): Add(), Today(), uid(), atTime(), dateStr(), isActiveOn(), pad(), REMIND_BEFORE_MIN (+3 more)

### Community 8 - "AGENTS.md"
Cohesion: 0.33
Nodes (5): Building with EAS, Commands, Expo has changed — do not trust your training data, Navigation & Routing, Rules

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@electric-sql/pglite` connect `server/src/api.js` to `package.json`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Why does `grammy` connect `package.json` to `schedule.js`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `Haftalik rejam: yakuniy reja (Variant B, ikki qatlamli eslatma)` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `server/src/api.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12315270935960591 - nodes in this community are weakly interconnected._
- **Should `App.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1484480431848853 - nodes in this community are weakly interconnected._
- **Should `app/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.11255411255411256 - nodes in this community are weakly interconnected._