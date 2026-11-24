# Ish jurnali (oxirgi yangilanish: 2026-11-25)

## Tayyor
- `server/`: Node + grammY bot, HTTP API, scheduler (15 daq. oldin eslatma, tugaganda so'rov, 5 daq. keyin takror). PostgreSQL (`pg`), testlarda PGlite. 15/15 test.
- `app/`: Expo + React Native + notifee. Release APK yig'ilgan: `dist/haftalik-rejam.apk` (21 MB, arm64). Telefonda hali sinalmagan.
- Bot `@haftalik_rejam_bot` shu kompyuterda ishlagan: /start, vazifa qo'shish, 15 daq. oldin eslatma tasdiqlangan (foydalanuvchi ko'rgan). "Bajardingizmi?" so'rovi tasdiqlanmagan.
- Graph: `graphify-out/`.

## Keyingi chatda davom etish (Neon)
1. Foydalanuvchi neon.com'da o'zi hisob ochadi (sayt botni tekshiradi, men ocha olmadim) va `DATABASE_URL` (postgresql://...) beradi.
2. `server/.env` ga `DATABASE_URL=` yoziladi, `npm test`, so'ng serverni qayta ishga tushirish.
3. Eski SQLite ma'lumoti kerak bo'lsa: `node --experimental-sqlite scripts/migrate-from-sqlite.js` (faqat 1 foydalanuvchi, sinov vazifalar).
4. Doimiy hosting: bepul hostinglarning ko'pi uxlaydi. Oracle Cloud bepul VM (karta tasdig'i kerak) yoki shu kompyuter + HTTPS tunnel. Telefon ilovasi faqat `https://` manzilga ulanadi (APK `http`ni bloklaydi).
5. APK'ni telefonga o'rnatish, Sozlama'da server manzili va bot kodini kiritish, Xiaomi sozlamalarini bajarish.

## Eslatmalar
- Yig'ish faqat `C:\hr\app` da ishladi (manzilda bo'sh joy bo'lmasligi kerak). Buyruq: `gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a`, JAVA_HOME = Android Studio jbr. Android SDK Platform 37 o'rnatilgan.
- `server/.env` da BOT_TOKEN bor (git'ga tushmaydi). Token chatda yozilgan, xohlasangiz BotFather'da `/revoke` qiling.
- Server hozir mahalliy PGlite (`server/data/pglite`) bilan ishlab turibdi; sessiya yopilsa to'xtashi mumkin.
