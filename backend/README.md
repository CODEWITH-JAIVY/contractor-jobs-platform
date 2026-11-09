# Backend

```bash
docker compose up --build     # MySQL + backend (pehli baar build me kuch minute)
./smoke-test.sh               # poora flow auto-check (login, job, follow, notification, apply, hisaab, delete)
```
Compile error aaye to `docker compose up --build` ke output me dikhega.

# Contractor Jobs - Backend (Module 1)

## Run
```bash
docker compose up -d          # MySQL
mvn spring-boot:run           # http://localhost:8080
```

## Quick test (dev OTP = 123456)
```bash
# 1) Contractor signup
curl -X POST localhost:8080/auth/send-otp -H 'Content-Type: application/json' -d '{"phone":"9876543210"}'
curl -X POST localhost:8080/auth/verify-otp -H 'Content-Type: application/json' \
  -d '{"phone":"9876543210","otp":"123456","name":"Raju","role":"CONTRACTOR","city":"Noida"}'
# token ko CT me rakho

# 2) Profile + job
curl -X PUT localhost:8080/contractors/profile -H "Authorization: Bearer $CT" -H 'Content-Type: application/json' \
  -d '{"companyName":"Raju Constructions","workType":"Mason","experienceYears":8}'
curl -X POST localhost:8080/jobs -H "Authorization: Bearer $CT" -H 'Content-Type: application/json' \
  -d '{"title":"Mason chahiye","location":"Noida Sector 62","salary":900,"workersNeeded":5}'

# 3) User signup, follow, feed
curl -X POST localhost:8080/auth/send-otp -H 'Content-Type: application/json' -d '{"phone":"9123456780"}'
curl -X POST localhost:8080/auth/verify-otp -H 'Content-Type: application/json' \
  -d '{"phone":"9123456780","otp":"123456","name":"Amit","role":"USER","city":"Noida"}'
# token ko UT me rakho; Raju ka userId (verify response me) 1 maan lo
curl -X POST localhost:8080/follow/1 -H "Authorization: Bearer $UT"
curl localhost:8080/jobs/feed -H "Authorization: Bearer $UT"
```

## Module 2: Apply
```bash
# user ne job 1 par apply kiya
curl -X POST localhost:8080/jobs/1/apply -H "Authorization: Bearer $UT"
curl localhost:8080/applications/my -H "Authorization: Bearer $UT"

# contractor applicants dekhe aur accept kare
curl localhost:8080/jobs/1/applicants -H "Authorization: Bearer $CT"
curl -X PUT localhost:8080/applications/1/status -H "Authorization: Bearer $CT" \
  -H 'Content-Type: application/json' -d '{"status":"ACCEPTED"}'
```

## Module 3: Notifications
```bash
# user follow kar chuka hai (Module 1), ab contractor naya job post kare
curl -X POST localhost:8080/jobs -H "Authorization: Bearer $CT" -H 'Content-Type: application/json' \
  -d '{"title":"Painter chahiye","location":"Noida Sector 18","salary":800,"workersNeeded":3}'

# user ke notifications
curl localhost:8080/notifications -H "Authorization: Bearer $UT"
curl localhost:8080/notifications/unread-count -H "Authorization: Bearer $UT"
curl -X PUT localhost:8080/notifications/read-all -H "Authorization: Bearer $UT"
```
Console me `[FCM disabled] 1 devices <- ...` dikhega agar user ka FCM token set hai
(`PUT /users/me/fcm-token`). Token nahi hai to bhi notification DB me save hota hai.

### Real push on karna
1. Firebase Console > Project settings > Service accounts > Generate new private key
2. File ko `firebase-service-account.json` naam se project root me rakho (gitignored hai)
3. `application.yml` me `app.fcm.enabled: true`

## Google login
`GOOGLE_CLIENT_ID=<web client id>` env set karo, phir:
```bash
# app se mile Google idToken ke saath
curl -X POST localhost:8080/auth/google -H 'Content-Type: application/json' -d '{"idToken":"..."}'
# naya account ho to response me needsPhone:true aayega; phir phone+otp+role ke saath dobara bhejo
```

## Attendance (worker token UT ke saath)
```bash
curl -X PUT localhost:8080/attendance/settings -H "Authorization: Bearer $UT" -H 'Content-Type: application/json' -d '{"dailyWage":700,"overtimeRate":100}'
curl -X PUT localhost:8080/attendance/2026-11-02 -H "Authorization: Bearer $UT" -H 'Content-Type: application/json' -d '{"status":"PRESENT","overtimeHours":2,"note":"Sector 62 site"}'
curl "localhost:8080/attendance/summary?month=2026-11" -H "Authorization: Bearer $UT"
```

## Paisa mila + worker profile
```bash
curl -X POST localhost:8080/attendance/payments -H "Authorization: Bearer $UT" -H 'Content-Type: application/json' -d '{"date":"2026-11-03","amount":500,"note":"advance"}'
curl "localhost:8080/attendance/summary?month=2026-11" -H "Authorization: Bearer $UT"   # balance dekho
curl -X PUT localhost:8080/workers/me/profile -H "Authorization: Bearer $UT" -H 'Content-Type: application/json' -d '{"skills":"Mason, Plaster","experienceYears":5,"about":"Noida me kaam kiya hai"}'
```
