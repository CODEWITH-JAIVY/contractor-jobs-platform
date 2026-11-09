# Flutter app setup

```bash
flutter create --org com.app --project-name contractor_jobs contractor_jobs
cd contractor_jobs
# is folder ki lib/ aur pubspec.yaml ko upar wale project me replace karo
flutter pub get
flutter run                      # emulator (backend: 10.0.2.2:8080)
flutter run --dart-define=API_URL=http://192.168.x.x:8080   # real phone (laptop ka IP)
```

## Android: http (non-https) allow karo (sirf dev ke liye)
`android/app/src/main/AndroidManifest.xml` me `<application ...>` tag me add karo:
`android:usesCleartextTraffic="true"`
aur `<application>` ke upar: `<uses-permission android:name="android.permission.INTERNET"/>`
Production me HTTPS use karna, ye flag hata dena.

## Push notification (optional, baad me)
```bash
dart pub global activate flutterfire_cli
flutterfire configure            # Firebase project select; google-services.json + gradle setup ho jata hai
```
Backend me `app.fcm.enabled: true` aur service-account JSON. Firebase setup na ho to app bina push ke chalta hai.

## Test flow
1. Phone A: Contractor signup -> Profile save -> Job daalo
2. Phone B: Worker signup -> Jobs tab -> job kholo -> contractor -> Follow
3. Contractor naya job post kare -> Worker ke Feed aur Alerts me aayega
4. Worker Apply kare -> Contractor Meri Jobs -> job -> Applicants -> Accept

## AdMob (Module 5)
`android/app/src/main/AndroidManifest.xml` ke `<application>` ke andar add karo (ye TEST app id hai, bina iske app crash hoga):
```xml
<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID"
           android:value="ca-app-pub-3940256099942544~3347511713"/>
```
Release se pehle AdMob console me app + 2 ad units (Banner, Interstitial) banao, manifest me apna App ID lagao, aur build me:
`flutter build appbundle --dart-define=API_URL=https://api.tumhara-domain.com --dart-define=BANNER_ID=... --dart-define=INTERSTITIAL_ID=...`

Ads sirf Worker side par dikhte hain: Feed/Jobs list me har 5 items ke baad banner, aur har 4th job kholne par ek interstitial.
Admin login: backend me `ADMIN_PHONES=98xxxxxxxx` set karo, us number se login karo to Admin screen khulegi.

## Google login
Google Cloud Console (ya Firebase) me:
1. OAuth consent screen set karo (app name, support email).
2. **Web application** type ka OAuth client banao -> iski Client ID hi `GOOGLE_WEB_CLIENT_ID` hai (Flutter ka serverClientId aur backend ka `GOOGLE_CLIENT_ID`, dono same).
3. **Android** type ka OAuth client banao: package name (`com.app.contractor_jobs`) + SHA-1.
   - Debug SHA-1: `cd android && ./gradlew signingReport`
   - Release ke liye Play Console > App signing wali SHA-1 bhi baad me add karni hogi.
4. Backend: `GOOGLE_CLIENT_ID=<web client id>` set karo. Khali raha to Google login band rahega.
5. App: `flutter run --dart-define=GOOGLE_WEB_CLIENT_ID=<web client id>`

Emulator me "Google APIs / Play Store" wali image chahiye. Agar login par error aaye to pehle SHA-1 aur package name match check karo.
Naya Google user ko ek baar mobile OTP dena padta hai. Uske baad sirf Google ka ek tap.
