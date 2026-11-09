# Play Store checklist

## Pehle ye 3 cheezein (bina inke reject / asafe)
- [ ] **Backend HTTPS par deploy** (domain + Caddy/Nginx). App ke `.env` me `EXPO_PUBLIC_API_URL=https://...` do, to cleartext apne aap band ho jata hai.
- [ ] **Backend prod mode**: `APP_ENV=prod`, `OTP_DEV_MODE=false`, `SMS_PROVIDER=msg91`, strong `JWT_SECRET`. (Galat config par app start hi nahi hoga.)
- [ ] **MSG91 + DLT**: India me OTP SMS ke liye DLT registration aur approved template chahiye. Isme kuch din lag sakte hain, to pehle shuru karo.

## Play Console
- [ ] Developer account (one-time registration fee). Naye personal account par closed testing ki requirement lagti hai (kitne testers, kitne din): Play Console me current rule check karo.
- [ ] Unique `applicationId`: abhi `com.app.contractorjobs` hai (app.json). Chahiye to badlo, phir Google/Firebase me bhi wahi package use karo. Har release par `version` aur `android.versionCode` badhao.
- [ ] Release keystore banao, **backup rakho**, Play App Signing on karo; `eas build -p android --profile production` (AAB)
- [ ] Target API level: Play ki current requirement check karo
- [ ] App icon, feature graphic, screenshots, short + full description
- [ ] **Privacy Policy URL** (phone number, FCM token, ads ka zikr karo)
- [ ] **Data safety form**: phone number, name, city, device ID/ads ID (AdMob), notifications
- [ ] **Ads declaration**: "App contains ads" = Yes
- [ ] Content rating questionnaire
- [ ] AdMob: `app.json` me plugin ka `androidAppId` apna karo + `.env` me real banner/interstitial IDs (test IDs release me nahi)
- [ ] Firebase: release SHA-1/SHA-256 add karo (FCM ke liye)

## Code me abhi baaki (submission se pehle zaroori)
- [x] Account delete: in-app menu + backend `DELETE /users/me` bana diya. Play Console me ye URLs do: `https://<your-domain>/privacy-policy.html` aur `https://<your-domain>/delete-account.html` (dono templates hain, [APP_NAME] aur [SUPPORT_EMAIL] badlo)
- [ ] Rate limiting abhi single server ke liye (memory me). Multiple servers ho to Redis version.
- [ ] Contractor verification: abhi admin phone par call karke verify karta hai; business ke hisaab se process tay karo.

## Google login
- [ ] OAuth consent screen publish karo (testing mode me sirf test users login kar sakte hain)
- [ ] Play App Signing wali SHA-1 Android OAuth client me add karo
- [ ] Data safety form me email address bhi add karo
- [ ] Google ke sign-in button branding guidelines follow karo (abhi simple outlined button hai)

## Hisaab (attendance)
- [ ] Data safety form: user ke daale hue attendance/wage records ka zikr (private, sirf user ko dikhte hain, delete par hat jate hain)
- [ ] Data safety: worker profile (skills/experience) contractor ke saath share hoti hai jab worker apply kare; payments private
- [ ] Share link ke liye `.env` me `EXPO_PUBLIC_APP_LINK=<Play Store URL>` do (app publish hone ke baad)
