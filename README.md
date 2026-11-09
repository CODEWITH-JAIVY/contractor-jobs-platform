# Contractor Jobs

Contractor jobs post karte hain, workers contractor ko follow karte hain aur nayi job par notification paate hain.
Worker side par AdMob ads se earning. Worker apna attendance, overtime aur paisa mila ka hisaab bhi rakh sakta hai.

```
contractor-jobs/
├── README.md                  <- ye file
├── PROJECT_CONTEXT.md         <- naye AI chat me paste karne ke liye (status, APIs, rules)
├── PLAY_STORE_CHECKLIST.md
├── backend/                   <- Spring Boot 3 + MySQL + JWT + FCM + MSG91
│   ├── pom.xml, Dockerfile, docker-compose.yml, docker-compose.prod.yml
│   └── src/ ...
└── mobile_app/                <- React Native (Expo) + TypeScript, Android
    ├── package.json, app.json, SETUP.md, .env.example
    └── App.tsx, src/ ...
```

## Backend chalana
```bash
cd backend
docker compose up --build   # MySQL + backend, dono Docker me (http://localhost:8080, dev OTP = 123456)
```
Ready hai jab logs me `Started ContractorApplication` dikhe (`docker compose logs -f app`).
Phir poora flow check: `./smoke-test.sh` (curl chahiye).
Docker ke bina: `docker compose up -d mysql` aur `mvn spring-boot:run`.

## Mobile app chalana
`mobile_app/SETUP.md` dekho. Short me:
```bash
cd mobile_app
cp .env.example .env
npm install
npx expo start              # Expo Go se UI dekho (Google login/push/ads ke liye dev build chahiye)
```

## GitHub par daalte waqt
`.gitignore` already hai. Kabhi commit mat karna: `firebase-service-account.json`, `google-services.json`, `.env`, keystore (`*.jks`), real API keys.
