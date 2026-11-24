# Haftalik rejam

Kunlik rejalar: ilova + Telegram bot. Ish boshlanishidan 15 daqiqa oldin eslatma, tugaganda "bajardingizmi?" so'rovi.
Reja: [REJA.md](REJA.md) · Jurnal: [PROGRESS.md](PROGRESS.md)

## Server + bot (`server/`)
1. BotFather'da yangi token oling (yoki mavjud `@haftalik_rejam_bot` tokenini `/token` orqali qayta oling).
2. `cd server && cp .env.example .env`, `BOT_TOKEN` ni yozing.
3. `npm install && npm test && npm start`
4. Botga `/start` yuboring: u ilovaga ulash kodini beradi.

Deploy: `server/Dockerfile` (volume `/data` doimiy bo'lishi shart, aks holda bazaga yozilganlar yo'qoladi).
Bepul hostingda jarayon uxlab qolsa, eslatmalar kechikadi. Doimiy ishlaydigan joy tavsiya etiladi.

## Ilova (`app/`)
notifee native modul, shuning uchun Expo Go ishlamaydi. APK'ni bulutda yig'ish:
```
cd app
npx eas-cli login
npx eas-cli build -p android --profile preview
```
Telefonda: Sozlama → server manzili + bot kodi → Ulash. Xiaomi sozlamalarini o'sha ekrandagi tugmalar orqali bajaring.
