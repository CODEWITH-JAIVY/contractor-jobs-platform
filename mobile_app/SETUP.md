# Mobile app (React Native + Expo)

Stack: Expo SDK 58, React Native 0.88, TypeScript, React Navigation. Android first.

## 1) Jaldi chalana (UI dekhne ke liye, ~5 minute)
```bash
cd mobile_app
cp .env.example .env        # EXPO_PUBLIC_API_URL set karo
npm install
npx expo start              # phone par "Expo Go" app se QR scan karo
```
- Emulator: `EXPO_PUBLIC_API_URL=http://10.0.2.2:8080`
- Real phone: laptop ka IP, jaise `http://192.168.1.5:8080` (phone aur laptop same WiFi par, firewall me 8080 allow)
- **Expo Go me Google login, push notification aur ads nahi chalte** (ye native modules hain). Baaki poora app chalta hai.

## 2) Poora app (Google login + push + ads): dev build
```bash
npx expo run:android        # Android Studio + SDK chahiye, phone USB debugging ya emulator
```
Ya bina Android Studio ke, cloud build: `npm i -g eas-cli && eas login && eas build:configure && eas build -p android --profile development`

### Google login
1. Google Cloud Console: **Web** OAuth client banao. Iski Client ID `.env` me `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` me do (backend ka `GOOGLE_CLIENT_ID` bhi wahi).
2. Wahin **Android** OAuth client banao: package name `com.app.contractorjobs` + SHA-1.
   - SHA-1: `npx expo prebuild --platform android` ke baad `cd android && ./gradlew signingReport` (ya `eas credentials`)
   - Play Console ki App signing wali SHA-1 bhi baad me add karni hogi.
3. Dev build dobara banao (env badalne par).

### Push notification
1. Firebase project me Android app jodo: package `com.app.contractorjobs`.
2. `google-services.json` download karke `mobile_app/` ke root me rakho (git me nahi jata). Dev build dobara banao.
3. Backend: Firebase service-account JSON aur `FCM_ENABLED=true`.

### Ads (AdMob)
Abhi Google ke **test** ads hain. Release se pehle:
- `app.json` me `react-native-google-mobile-ads` plugin ka `androidAppId` apna AdMob App ID karo
- `.env` me `EXPO_PUBLIC_BANNER_ID` aur `EXPO_PUBLIC_INTERSTITIAL_ID`
- Development me apne real ads par kabhi click mat karna.

## 3) Release (Play Store)
- `.env`: `EXPO_PUBLIC_API_URL=https://api.tumhara-domain.com` (https dene par cleartext apne aap band ho jata hai)
- `EXPO_PUBLIC_APP_LINK=<Play Store link>` (WhatsApp share me judta hai)
- `app.json`: `version`, aur `android.versionCode` har release par badhao
- `eas build -p android --profile production` (AAB milega)

## Code ka naksha
```
App.tsx                     session + navigation root
src/theme.ts                rang, timeAgo, inr (Indian rupee format)
src/api.ts, session.tsx     backend calls (JWT), login state (SecureStore)
src/native/                 google.ts, push.ts, ads.tsx (Expo Go me bhi crash nahi, chup-chap skip)
src/components/             ui.tsx, ApiList.tsx (infinite scroll + ads), job.tsx (JobTile, WhatsApp share), HeaderMenu.tsx
src/navigation/             RootNavigator.tsx, types.ts
src/screens/                Login, JobDetail, Contractor, WorkerProfile, Applicants
src/screens/worker/         WorkerTabs (Feed, Jobs, Alerts, Applied), AttendanceScreen (Hisaab)
src/screens/contractor/     ContractorTabs (Meri jobs, Job daalo, Profile)
src/screens/admin/          AdminScreen
```
Type check: `npm run typecheck`
