# Contractor Jobs App - Context (har naye chat me ye paste karo)

Folder layout: backend/ (Spring Boot) | mobile_app/ (React Native + Expo, TypeScript) | is file ke saath docs

## Idea
Contractor profile banata hai aur jobs post karta hai. User contractor ko follow karta hai
aur followed contractors ki nayi jobs par push notification milti hai. User side par AdMob ads se earning.

## Stack
Backend: Java 17, Spring Boot 3.3, Spring Security + JWT (jjwt 0.12), JPA, MySQL, firebase-admin 9.4.1
App: React Native (Expo SDK 58, Android) | Push: FCM (expo-notifications) | Ads: AdMob (react-native-google-mobile-ads)
Base package: com.app.contractor (controller / service / repository / entity / dto / security / exception / event / config)

## Status
- [x] Module 1: Auth (OTP dev-mode + JWT), entities, contractor profile, Job CRUD, Follow, feed
- [x] Module 2: Apply to job, my applications, applicants list, accept/reject
- [x] Module 3: Notifications (DB + FCM push), async after-commit listeners
- [x] Module 4: Mobile app MVP (React Native Expo: mobile_app/)
- [x] Module 5 (core): MSG91 SMS OTP, rate limiting, admin (verify contractors), AdMob (worker side), Dockerfile + prod compose, Play checklist
- [x] Account delete: DELETE /users/me (AccountService, sab linked data purge) + app menu + /privacy-policy.html + /delete-account.html (templates)
- [ ] Baaki: Redis rate limit (multi-server), infinite scroll, contractor search, tests, real keystore/AdMob IDs

## Entities
User(id, name, phone[unique], role USER|CONTRACTOR|ADMIN, city, fcmToken, createdAt)
ContractorProfile(id, user[1-1], companyName, workType, experienceYears, about, verified)
Job(id, contractor[User], title, description, location, salary, workersNeeded, status OPEN|CLOSED, createdAt)
Follow(id, user, contractor, createdAt) unique(user_id, contractor_id)
JobApplication(id, job, user, status APPLIED|ACCEPTED|REJECTED, createdAt) unique(job_id, user_id)
UserNotification(id, user, job?, title, body, seen[col is_read], createdAt)  table: notifications

## APIs (JWT: Authorization: Bearer <token>)
POST /auth/send-otp {phone} | POST /auth/verify-otp {phone, otp, name?, role?, city?} -> {token,userId,role,newUser}
GET /users/me | PUT /users/me/fcm-token {token} | DELETE /users/me (admin ko nahi)
PUT /contractors/profile [CONTRACTOR] | GET /contractors?q= | GET /contractors/{userId}
POST /jobs [CONTRACTOR] | GET /jobs?city= | GET /jobs/{id} | GET /jobs/mine [CONTRACTOR] | PUT /jobs/{id}/close [CONTRACTOR owner]
GET /jobs/feed [USER] | GET /jobs/by-contractor/{contractorId} (OPEN jobs)
POST /follow/{contractorId} | DELETE /follow/{contractorId} | GET /follow/my   [USER]
POST /jobs/{jobId}/apply [USER] | GET /applications/my [USER]
GET /jobs/{jobId}/applicants [CONTRACTOR owner] | PUT /applications/{id}/status {status: ACCEPTED|REJECTED} [CONTRACTOR owner]
GET /notifications | GET /notifications/unread-count | PUT /notifications/{id}/read | PUT /notifications/read-all  [any logged-in]

## Rules / decisions
- Controllers me @AuthenticationPrincipal Long uid (principal = userId)
- DTOs sab Dtos.java me records; entity direct return nahi
- open-in-view=false, isliye entity->DTO mapping @Transactional service ke andar
- Error format: {"error": "..."}; ApiException(HttpStatus, msg); duplicate DB entry -> 409
- Events: JobCreatedEvent (JobService.create), ApplicationStatusEvent (ApplicationService.updateStatus)
  NotificationService @Async + @TransactionalEventListener(AFTER_COMMIT) + REQUIRES_NEW
  followers 500-500 ke chunks me (FCM multicast limit), dead tokens (UNREGISTERED) null ho jate hain
- app.otp.dev-mode=true => OTP hamesha 123456 (production me false + SMS provider)
- app.fcm.enabled=false default => notification sirf DB me; true + firebase-service-account.json (gitignored) se push
- Mobile app login ke baad PUT /users/me/fcm-token call karta hai (expo-notifications ka native FCM token)

## Module 5 notes
- SmsSender interface: LogSmsSender (SMS_PROVIDER=log) | Msg91SmsSender (msg91; POST /api/v5/otp, header authkey, hum khud OTP generate karte hain)
- OTP: 5 galat attempt par OTP khatam; RateLimiter (in-memory sliding window): send-otp 3/10min per phone + 20/hr per IP, verify 10/10min per phone, job post 10/day, apply 50/day -> 429
- StartupChecks: APP_ENV=prod me OTP_DEV_MODE=true / default JWT_SECRET / SMS_PROVIDER=log par app start nahi hoga
- Admin: ADMIN_PHONES env se startup par ADMIN user; /admin/stats, GET /admin/contractors?verified=false, PUT /admin/contractors/{id}/verify|unverify, PUT /admin/jobs/{id}/close
- JobStatus me naya value mat jodo (MySQL enum column ddl-auto update se alter nahi hota); admin removal = CLOSED
- Deploy: Dockerfile, docker-compose.prod.yml (.env: DB_PASSWORD, JWT_SECRET, MSG91_AUTH_KEY, MSG91_TEMPLATE_ID, ADMIN_PHONES)

## Google login
POST /auth/google {idToken, phone?, otp?, name?, role?, city?} -> {token,userId,role,newUser,needsPhone,email,name}
- Known googleSub -> seedha login. Naya Google account -> needsPhone=true; app phone+OTP+role bhej kar dobara call karti hai (phone par pehle se account ho to Google us se link hota hai).
- Backend: GoogleTokenVerifier (google-api-client, audience = GOOGLE_CLIENT_ID = Web client ID). User me googleSub (unique) + email.
- Phone User.phone abhi bhi NOT NULL (contractor-worker calling ke liye)

## Worker ka Hisaab (attendance + overtime)
Private diary, sirf USER role. Contractor ko nahi dikhta. Account delete par purge hota hai.
Entity AttendanceEntry(user, workDate[unique per user], status PRESENT|HALF_DAY|ABSENT, overtimeHours 0.5 step max 16, note, dailyWage/overtimeRate snapshot). User me dailyWage, overtimeRate (settings).
APIs: GET /attendance?month=YYYY-MM | GET /attendance/summary?month= | PUT /attendance/{yyyy-MM-dd} {status, overtimeHours, note} | DELETE /attendance/{date} | GET/PUT /attendance/settings {dailyWage, overtimeRate}
Rules: aage ki date (kal se zyada) nahi; ABSENT me overtime 0; rate badalne par purane din purane rate par (snapshot, null ho to abhi ka rate); kamai = present*wage + half*0.5*wage + overtime*rate

## Paisa mila / advance, Worker profile, Share, Infinite scroll
- PaymentEntry(user, payDate, amount, note): worker ka private. APIs: GET /attendance/payments?month= | POST /attendance/payments {date, amount, note} | DELETE /attendance/payments/{id}
- /attendance/summary ab receivedThisMonth + balance (poori kamai - poora mila; negative = advance zyada) bhi deta hai
- WorkerProfile(user 1-1, skills, experienceYears, about): GET/PUT /workers/me/profile [USER]. ApplicantResponse me skills/experienceYears/about aate hain (contractor ko sirf apply karne par)
- Account delete par attendance, payments, worker profile sab purge

## Mobile app: React Native (Expo SDK 58, RN 0.88, TypeScript)  [Flutter version hata diya gaya]
Verify hua: `npm run typecheck` clean, Android JS bundle (Metro/Hermes) ban gaya, `expo prebuild` ka manifest sahi (package, AdMob ID, cleartext). Device par / Gradle build abhi test nahi hua.
- Config: .env (EXPO_PUBLIC_API_URL, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, EXPO_PUBLIC_BANNER_ID, EXPO_PUBLIC_INTERSTITIAL_ID, EXPO_PUBLIC_APP_LINK); app.config.js: https API URL par cleartext off, google-services.json ho to FCM on
- Native modules lazy require (src/native/*): Expo Go me Google login / push / ads chup-chap skip, baaki app chalta hai. Poore features ke liye dev build (expo run:android / EAS)
- Package: com.app.contractorjobs (app.json). Google OAuth Android client me yahi package + SHA-1
- api.ts (fetch + JWT, 401 par auto logout), session.tsx (SecureStore), components/ApiList.tsx (Page ya List, infinite scroll, focus par silent refresh, ads har 5 items), Ads.enabled sirf USER role
- Google login: @react-native-google-signin/google-signin v17 (signIn() -> {type:'success', data:{idToken}}), flow backend /auth/google jaisa
- Push: expo-notifications getDevicePushTokenAsync (Android par FCM token), backend firebase-admin se bhejta hai
- Screens: Login (OTP + Google, role tiles), Worker tabs (Feed, Jobs+city search, Alerts, Applied, Hisaab), Contractor tabs (Meri jobs, Job daalo, Profile), JobDetail (Apply, WhatsApp share), Contractor profile (Follow), Applicants (Call/Select/Reject + worker profile), WorkerProfile (header menu), Admin (stats + verify)
- Hisaab: month calendar, day bottom-sheet (status + overtime 0.5 step + note), rate sheet, paisa mila sheet (DateTimePickerAndroid), balance card, copy summary (expo-clipboard)
- UI design: hi-vis site signage. Tokens src/theme.ts: ink #1C2127, yellow #FFC20E, concrete #F3F4F2, steel #5B6670, green/red sirf status. Flat white rows (cards nahi), salary yellow badge, bade buttons (BigButton), Hinglish sentence-case copy, StatusPill, EmptyState har list me

