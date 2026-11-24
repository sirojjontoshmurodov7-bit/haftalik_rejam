# Haftalik rejam: yakuniy reja (Variant B, ikki qatlamli eslatma)

## 1. Qisqa xulosa
Android ilova (React Native) + Telegram bot. Vazifani vaqti bilan kiritasiz (bir martalik yoki har kuni). Boshlanishidan **15 daqiqa oldin** ilova eslatadi, bot ham shu vaqtda yuboradi. Ish **tugaganda** "Bajardingizmi?" so'raladi. Ilova eslatmasi Xiaomi'da yo'qolsa ham, bot zaxira sifatida yetkazadi.
**Qiymat taklifi:** "Esdan chiqmaydi": eslatma ikki kanalda keladi va natija (bajardim/yo'q) yozib boriladi.

## 2. Muammo va auditoriya
- Muammo: rejalashtirilgan ishlar esdan chiqadi, mavjud bot to'liq qoniqtirmadi (kiritish noqulay, statistika yo'q).
- Birinchi foydalanuvchi: siz (Xiaomi/Redmi/Poco). Keyin: o'zbek tilli talabalar va yosh mutaxassislar (taxmin).

## 3. Bozor tahlili
- Todoist, TickTick, Any.do eslatma va habit funksiyalarini beradi, lekin "ish tugaganda so'rash" va Telegram zaxirasi yo'q. Manba: [Jotform](https://www.jotform.com/blog/daily-planning-apps/), [Android Authority](https://www.androidauthority.com/keep-coming-back-to-ticktick-3719344/).
- Telegram habit botlari asosan EN/RU, o'zbekcha yo'q. Manba: [Product Hunt](https://www.producthunt.com/products/habitflow-pro-telegram-habit-tracker-bot).
- O'zbekiston bozori hajmi: **aniq ma'lumot topilmadi, bu taxmin.**
- Bo'shliq: o'zbekcha + ilova/bot juftligi + yakuniy "bajardingizmi" so'rovi.
- Xavf: Xiaomi HyperOS fondagi ilovani o'chiradi. Manba: [Xiaomi yordam](https://www.mi.com/ph/support/faq/details/KA-93183/), [PocketCheck](https://codeberg.org/Gonbei774/PocketCheck/issues/9).

## 4. Mahsulot
**MVP (1-hafta):**
- Vazifa: nomi, boshlanish va tugash vaqti, takror (bir martalik / har kuni / hafta kunlari).
- Mahalliy eslatma: 15 daq. oldin (aniq alarm, `setExactAndAllowWhileIdle`) va tugaganda "Bajardingizmi? Ha / Yo'q / Keyinroq".
- Telegram bot: shu vaqtlarda xuddi shu xabar, tugmalar bilan javob.
- Sinxronlash: ilova ↔ server (vazifalar va javoblar), Telegram'ga bog'lash kodi bilan.
- Ilova ichida Xiaomi sozlash ko'rsatmasi (batareya "cheklovsiz", autostart, Recents'da qulflash).
- Takroriy eslatma: ilova eslatmasiga javob bo'lmasa, bot 5 daq. keyin qayta so'raydi.

**Keyingi versiyalar:**
- v1.1: streak va haftalik hisobot (yakshanba kuni botga yuboriladi).
- v1.2: o'zbekcha ovozli kiritish. Android'ning nutq tanish tizimi o'zbekchani qanchalik yaxshi taniydi, **tekshirilmagan**; kerak bo'lsa Whisper/Gemini kabi xizmat ishlatiladi.
- v2: vidjet, AI tahlil, mas'uliyat sherigi (do'stga hisobot).

## 5. Pul modeli (taxmin)
Hozir daromad yo'q, avval o'zingiz uchun. 100+ foydalanuvchidan keyin: bepul asosiy funksiya, premium (AI tahlil, ovoz, sherik hisoboti) oyiga taxminan 1-2$ (taxmin, tekshirilmagan). To'lov: Click/Payme yoki Telegram Stars. Hosting va AI xarajati bepul rejada ~0$, ommaviy bo'lsa VPS ~5$/oy (taxmin).

## 6. Marketing
Avval o'zingiz 2 hafta ishlatasiz. Keyin do'stlar va guruhlar (Telegram kanallari), "Esdan chiqmaydigan reja" nomi bilan taklif. Referal: bot orqali do'stni taklif qilish.

## 7. Texnik reja
- Ilova: React Native + notifee (aniq alarm) + SQLite, Android 12+ uchun `SCHEDULE_EXACT_ALARM` ruxsati.
- Server + bot: Node.js (grammY) yoki Python (aiogram), PostgreSQL yoki SQLite, vazifalar jadvali (scheduler, har daqiqa tekshiradi).
- Hosting: Railway/Fly/Render bepul reja. Cheklovlari **tekshirilmagan**: bepul reja uxlab qolishi mumkin, bu esa eslatmani buzadi. Shuning uchun ishonchli joy kerak bo'lsa, arzon VPS.
- Eslatma kafolati: ilova alarm (1-qatlam) + bot yuborishi (2-qatlam), ikkalasi bitta vazifa ID bilan, takrorlanmasligi uchun javob olingach ikkinchisi bekor qilinadi.
- Mavjud botni qayta yozish tavsiya etiladi (kodi esda yo'q).

## 8. Yo'l xaritasi
- **30 kun:** MVP ishlaydi, o'zingiz har kuni ishlatasiz. Mezon: eslatmalarning 95% o'z vaqtida kelgan, hech bo'lmaganda bir kanalda.
- **90 kun:** streak, haftalik hisobot, ovozli kiritish. 10-20 do'st sinaydi. Mezon: kunlik foydalanuvchilarning 50% ikki hafta qoladi.
- **180 kun:** Play Market, premium sinovi. Mezon: 100+ foydalanuvchi, birinchi to'lovlar.

## 9. Xavflar
| Xavf | Yechim |
|---|---|
| Xiaomi eslatmani o'chiradi | Aniq alarm, sozlash ko'rsatmasi, bot zaxirasi |
| Bepul hosting uxlab qoladi | Cron ping yoki arzon VPS |
| Ikki kanal bezovta qiladi | Bitta javob ikkalasini yopadi, sozlamada ajratish |
| O'zbekcha ovoz noaniq | Matn bilan zaxira, keyin tashqi xizmat |
| Play Market siyosati (aniq alarm ruxsati) | Taqvim/eslatma ilovasi sifatida asoslash |

## 10. Birinchi 7 kunda 5 qadam
1. Eski bot tokenini BotFather'da tekshirish va yangi bot loyihasini ochish.
2. React Native loyihasi, notifee orqali 15 daq. oldin va tugash eslatmasini sinash (Xiaomi'da).
3. Vazifa ma'lumot modeli va takrorlanish mantig'i.
4. Server va botni yozib, ilova bilan bog'lash kodi orqali sinxronlash.
5. Bir hafta o'zingiz ishlatib, o'tkazib yuborilgan eslatmalarni sanash.

## 11. Ochiq savollar
- Eski bot kodi/tokeni qayerda?
- Eslatma vaqti (15 daq.) sozlanuvchi bo'lsinmi?
- Ovozli kiritish uchun qaysi xizmat (bepul chegarasi)?
- Kelajakda iPhone kerakmi? (React Native bilan mumkin, lekin eslatma mexanizmi boshqacha.)
