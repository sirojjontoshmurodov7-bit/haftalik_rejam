# Ish jurnali (oxirgi yangilanish: 2026-11-25, kech)

## Tayyor va ishlayapti
- **Server + bot** (`server/`): Node + grammY, HTTP API, scheduler (15 daq. oldin eslatma, tugaganda so'rov, 5 daq. keyin takror). Baza: Neon PostgreSQL (`DATABASE_URL`), testlarda PGlite. 9 integratsiya testi o'tadi.
- **API** vazifalar bo'yicha: `POST /api/tasks`, `PUT/DELETE /api/tasks/:id`; `GET /api/state` (oxirgi 45 kun, `today`, `weekday`). Eski to'liq almashtiruvchi `PUT /api/tasks` saqlangan, lekin hech kim ishlatmaydi.
- **Hosting:** Render Free (Docker, Root Directory `server`), `https://haftalik-rejam.onrender.com`. GitHub `sirojjontoshmurodov7-bit/haftalik_rejam` (`main` ga push qilinsa Render o'zi yangilaydi).
- **UptimeRobot:** `/health` ni har 5 daq. ochadi (server uxlamaydi). Ro'yxatda takror ikkinchi monitor bor, o'chirsa bo'ladi.
- **Veb-sayt** (`server/public/`: `index.html`, `app.css`, `app.js`, `tokens.css`, `base.css`): Hum dizayni (qog'oz, karta-tugmalar, Chillax). Kirish botdagi 6 xonali kod bilan (brauzerda saqlanadi). Bugun (vazifa kartalari, Bajardim/Bajarmadim, inline qo'shish shakli), Hafta bog'i (signature), Hafta (raqamlar, 6 haftalik xarita, kun tafsiloti).
- **Android ilova** (`app/`: Expo + React Native + notifee): sayt bilan bir xil dizayn. Bugun (progress, Hafta bog'i, vazifa kartalari), **Hafta** (raqamlar, 6 haftalik xarita, kun tafsiloti, shu haftaning jadvali), Sozlama (ulash + Xiaomi ko'rsatmalari), tepada **+** tugmasi va "Yangi vazifa" oynasi (soat/daqiqa tanlagich, davomiylik tugmalari, klaviatura ustiga ko'tariladi). Vazifa amallari offlayn navbatga qo'yilib bittadan yuboriladi.
- **APK:** `dist/haftalik-rejam.apk` (arm64, ~26 MB). Telefon: Redmi Note 12 Pro, Android 13. Telefonda ochilishi tasdiqlangan (eski nusxada); eng yangi nusxa (+ oynasi, Hafta) emulyatorda sinalgan, telefonda hali yo'q.

## Keyingi chatda qilinadiganlar (tartib bilan)
1. **Xavfsizlik:** Neon parolini (Reset password) va bot tokenini (BotFather `/revoke`) yangilash, so'ng Render'da `DATABASE_URL` va `BOT_TOKEN` ni almashtirish. Ikkalasi chatda yozilgan edi.
2. **Telefonda sinov** (eng muhim): yangi APK, Sozlama'da kod bilan ulash, vazifani 20 daq. keyinga qo'yib 15 daq. oldin eslatma kelishini ko'rish, "Bajardingizmi?" so'rovi (bot va ilova), Xiaomi sozlamalari (batareya, autostart, alarm, qulflash). Eslatma kelmasa `adb logcat` bilan ko'rish.
3. **Kamchiliklar:**
   - Botda javob berilsa, ilovadagi rejalashtirilgan bildirishnomalar keyingi sync'gacha ishlayveradi (ikki qatlam bir tomonlama).
   - Botdagi "Keyinroq" hech narsa yozmaydi (faqat avtomatik takror).
   - `/ochir` faqat bugungi vazifalarni o'chiradi.
   - Haftalik hisobot yakshanba kuni o'zi yuborilmaydi (faqat `/hafta`).
   - Ilova 401 xatosini (sessiya yaroqsiz) jim yutadi: "Qayta ulang" deyishi kerak.
   - Vazifani tahrirlash yo'q (ilovada ham, saytda ham): o'chirib qayta qo'shiladi. `PUT /api/tasks/:id` tayyor.
   - Offlayn navbatdagi yaroqsiz amal (400) abadiy qolib ketishi mumkin.
4. **Sayt:** qo'shishni ilovadagidek "+" va oyna qilish, soat tanlagichni ilovadagidek qilish, "Shu haftaning jadvali" qismini qo'shish.
5. **Ilova:** Chillax shrifti (hozir tizim shrifti), daqiqa tanlagichda 1 daqiqalik aniqlik kerakmi (hozir 5 daq. qadam), vazifani tahrirlash.
6. **Keyin:** o'zbekcha ovozli kiritish, haftalik hisobot botda, Play Market (REJA.md 8-bo'lim).

## Eslatmalar (texnik)
- **APK yig'ish faqat `C:\hr\app` da ishlaydi** (manzilda bo'sh joy bo'lmasligi kerak). Manbani `app/` dan u yerga ko'chiring (`App.js`, `src/`), so'ng: `JAVA_HOME` = `C:\Program Files\Android\Android Studio\jbr`, `gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a`. Natija: `android/app/build/outputs/apk/release/app-release.apk`.
- **`android/gradle.properties` da `android.enableMinifyInReleaseBuilds=false` shart.** Aks holda R8 `androidx.work.impl.WorkDatabase` sinfini o'chirib, ilova ochilishda qulaydi. `android/` papkasi qayta generatsiya qilinsa, shuni qayta qo'ying (`app/.gitignore` uni git'ga olmaydi).
- **Emulyator:** `Pixel_9` (x86_64, sekin). arm64 APK uning ustida ishlamaydi: sinash uchun `-PreactNativeArchitectures=x86_64` bilan alohida yig'ing. `-no-window -gpu swiftshader_indirect -memory 3072` bilan ishga tushiring.
- `server/.env` da `BOT_TOKEN` va `DATABASE_URL` bor (git'ga tushmaydi). `.env` ni shell'da `source` qilmang (URL ichidagi `&` buyruqni bo'lib yuboradi), `node --env-file=.env` ishlating.
- Render bepul reja: UptimeRobot'siz uxlaydi va bot eslatmalari to'xtaydi (polling HTTP so'rov hisoblanmaydi).
- `.hallmark/` papkasi (dizayn skill sozlamasi) git'ga olinmaydi.
