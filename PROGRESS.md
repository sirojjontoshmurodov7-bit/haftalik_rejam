# Ish jurnali (oxirgi yangilanish: 2026-11-25)

## Tayyor
- `server/`: Node + grammY bot, HTTP API, scheduler (15 daq. oldin eslatma, tugaganda so'rov, 5 daq. keyin takror). Baza: Neon PostgreSQL (`DATABASE_URL`), testlarda PGlite. 17 test.
- API vazifalar bo'yicha ishlaydi: `POST /api/tasks`, `PUT/DELETE /api/tasks/:id` (eski `PUT /api/tasks` to'liq almashtirish saqlangan, lekin ilova endi ishlatmaydi).
- Veb-sayt: `server/public/` (Hum dizayni: qog'oz, karta-tugmalar, "Hafta bog'i"). Server o'zi beradi, manzil: https://haftalik-rejam.onrender.com. Kirish: botdagi 6 xonali kod.
- Hosting: Render (Free, Docker, Root Directory `server`), GitHub: sirojjontoshmurodov7-bit/haftalik_rejam (main'ga push qilinsa o'zi yangilanadi).
- `app/`: Expo + React Native + notifee, saytdagi dizaynga o'tkazilgan (bog', Bajardim/Bajarmadim tugmalari, amallar navbati). APK: `dist/haftalik-rejam.apk`.
- Bot `@haftalik_rejam_bot` Render'da ishlaydi.

## Hali qilinmagan
1. UptimeRobot: `https://haftalik-rejam.onrender.com/health` ni har 5 daq. ochib turishi (Render bepul reja uxlab qolmasligi uchun).
2. APK'ni telefonga o'rnatish, Sozlama'da kod kiritish, Xiaomi sozlamalari. Telefonda sinalmagan.
3. Kamchiliklar: botda javob bersangiz ilovadagi rejalashtirilgan bildirishnomalar sync bo'lguncha ishlayveradi; botdagi "Keyinroq" hech narsa yozmaydi; `/ochir` faqat bugungi vazifalarni o'chiradi; haftalik hisobot o'zi yuborilmaydi; saytda vazifani tahrirlash yo'q (o'chirib qayta qo'shiladi).
4. Xavfsizlik: Neon parolini (Reset password) va bot tokenini (BotFather `/revoke`) yangilash, chunki chatda yozilgan. Render'da `DATABASE_URL` va `BOT_TOKEN` ni yangilash.

## Eslatmalar
- APK yig'ish faqat `C:\hr\app` da ishladi (manzilda bo'sh joy bo'lmasligi kerak). Buyruq: `gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a`, `JAVA_HOME` = Android Studio jbr. Android SDK Platform 37 o'rnatilgan. Ilova manbasini `app/` dan `C:\hr\app` ga ko'chirish kerak.
- `server/.env` da BOT_TOKEN va DATABASE_URL bor (git'ga tushmaydi). `.env` ni shell orqali `source` qilmang (URL ichidagi `&` buyruqni bo'lib yuboradi); `node --env-file=.env` ishlating.
- Android emulyatori (Pixel_9) bu kompyuterda juda sekin, ilovani real telefonda sinang.
