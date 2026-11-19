# React Native release runbook

Status: locally hardened; NOT approved for production or Play submission. See the audit report for actual check results and unresolved items. No deployment, upload, commit, DNS change or publication was performed.

## Architecture and scope

The active Android app is `mobile_app`: Expo 58, React Native 0.88, React 19, TypeScript and React Navigation. The actual package is **com.sanjeet.contractorjobs**. Older root docs and the pre-existing generated `android/` use a different package. Preserve the current package unless the owner confirms an existing Play application has another ID. Existing React Navigation was preserved to avoid an unrelated navigation migration despite generic AGENTS.md guidance favoring Router.

The backend is Spring Boot 3.3.5 / Java 17 / MySQL, with JWT authentication, contractor SMS OTP via MSG91, worker Google authentication, FCM device notifications, AdMob ads, and database-backed job/application/profile/attendance/payment records. Worker sign-in does NOT require a phone number; optional contact phone is shared with applicants' contractors. There is no uploaded-file API or S3 dependency. No app-owned analytics/crash reporting SDK is configured; AdMob may collect diagnostics. The Flutter frontend and `lib_old_backup` are outside this change.

## Mobile environment inventory

All EXPO_PUBLIC values are bundled and publicly readable. Do not put AWS credentials, JWT secrets, service-account JSON, database passwords or signing passwords in them.

| Variable | Consumer | Required |
|---|---|---|
| APP_VARIANT | app.config.js / config/release.js | development, preview or production; defaults to production |
| EXPO_PUBLIC_API_URL | src/api.ts + config validator | Public HTTPS origin/path for preview/production; development alone allows local HTTP |
| EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID | src/native/google.ts + validator | Required for workers in production; same audience as backend GOOGLE_CLIENT_ID |
| ADMOB_ANDROID_APP_ID | app.config.js | Real Android AdMob app ID for release |
| EXPO_PUBLIC_BANNER_ID / EXPO_PUBLIC_INTERSTITIAL_ID | src/native/ads.tsx | Real release ad unit IDs; development always uses test ads |
| EXPO_PUBLIC_APP_LINK | src/components/job.tsx | Optional Play listing link; use correct package |
| GOOGLE_SERVICES_JSON | app.config.js | Local path or EAS file variable; must match Android package |
| ANDROID_VERSION_CODE | app.config.js | Positive integer, higher than every previous Play upload; default 1 only for a new app |
| ANDROID_KEYSTORE_PATH / ANDROID_KEYSTORE_PASSWORD / ANDROID_KEY_ALIAS / ANDROID_KEY_PASSWORD | generated Gradle via plugins/withReleaseSigning.js | Local release signing only; never EXPO_PUBLIC |
| EAS_BUILD | generated signing guard | Set by EAS, not a manual bypass |

The existing .env was preserved. `.env.production.example` contains blank placeholders, not working credentials. EAS production and preview environments must contain their own public settings and Firebase file. Use file visibility available during local config evaluation; do not rely on a secret file that is unavailable until a remote build starts. `.easignore` excludes existing native directories, environment files, and keys so EAS regenerates Android from configuration.

## Development and release checks

From mobile_app:

```powershell
npm ci
npm run lint
npm run typecheck
npm test
$env:APP_VARIANT='development'
npx expo install --check
npx expo-doctor
npm start
```

`npm start` and `npm run android` set development mode explicitly. The existing ignored android directory predates the current package; use a fresh copy/worktree with dependencies installed before native generation. Do not reuse that directory for Play release, and do not delete it without checking for native customizations.

Before a production build, set production values in the process environment or the EAS production environment. Do not use NODE_ENV to select API configuration. Disable dotenv loading for controlled CI runs (`EXPO_NO_DOTENV=1`) and supply every value explicitly. Production config intentionally fails when prerequisites are missing, URLs are local/test/HTTP, ad IDs are Google's test IDs, or Firebase package identity mismatches.

Preferred build after configuration and ownership checks:

```powershell
$env:APP_VARIANT='production'
npx eas-cli@latest build --platform android --profile production
```

This builds an AAB; it does not submit to Play. EAS project ownership must be confirmed for the existing project ID in app.json. EAS signing credentials must be supplied or created by the owner, with secure backups and Play App Signing enrollment. No keystore was invented or generated in this task. For optional sideload testing use the preview profile, which produces an APK with staging HTTPS configuration. A signed APK is not required for a Play testing track; Play can use the AAB.

For a local release, in a fresh copy with no native directories: set the production variables and all four ANDROID_KEY* variables, then run `npm run prebuild:android`, followed by `android\gradlew.bat -p android :app:bundleRelease`. Install the SDK/NDK versions selected by Expo, and use a compatible JDK. A development prebuild cannot be reused for release. The generated plugin removes debug signing from release and rejects absent local upload credentials. On EAS, managed signing is injected by EAS; verify the resulting certificate before uploading.

Inspect the resulting bundle with bundletool: package ID, versionCode, target SDK >=36, no debug signing, no cleartext, no unexpected permissions, Firebase/Google audience and release certificates. Verify all native libraries support 16 KB pages on an appropriate emulator/device. Never assume a Metro export equals a signed Android build.

## AWS deployment plan — approval required before provisioning

Use the existing Docker image on **one EC2 application instance**, private RDS MySQL, an Application Load Balancer with ACM HTTPS, ECR, Secrets Manager and CloudWatch. This is a minimal adaptation of the existing Docker setup, not a framework migration. Account, region, budget, domain and network details remain owner decisions. No resources were created. Do not enable multiple app replicas: OTP state and rate limits are process-local. A restart invalidates outstanding OTPs. Multiple instances or zero-downtime overlapping rollout require shared OTP/rate-limit storage first.

1. Confirm account/region, domain ownership, cost approval, data residency, availability and recovery requirements. Decide the EC2/RDS instance sizes and whether RDS Multi-AZ is required. Single application instance has downtime risk.
2. Create VPC/security groups: internet -> ALB 443; ALB group -> application 8080 only; application group -> private RDS 3306 only. No public RDS, no internet-accessible 8080/3306, no SSH ingress; use SSM Session Manager. Allow outbound HTTPS to Google, FCM and MSG91. Terminate TLS at ACM/ALB and redirect HTTP to HTTPS. Change DNS only after explicit approval.
3. Create encrypted RDS MySQL with deletion protection, automated backups (proposed 14 days, owner to confirm), point-in-time recovery, and storage/CPU/connection alarms. Use a least-privilege `contractor_app` account, never the root account from the old production compose file. Require TLS. Download the current regional RDS CA bundle from AWS, verify its source, and import the CA certificates into a PKCS12 Java truststore. The JDBC template uses VERIFY_IDENTITY and that truststore; test hostname/certificate verification.
4. **Schema prerequisite:** there are no versioned database migrations. The production Spring profile now uses `ddl-auto=validate`. Prepare reviewed schema SQL from the current entity model on a disposable database, reconcile it with any existing data, test on a restored backup, then apply using a separate migration identity. Do not turn Hibernate update on against live data or reset the database. Establish migration and rollback scripts before release.
5. Build and test locally: `mvn verify`, then `docker build -t contractor-backend:<release> backend`. Docker must be running. Scan the image and Java dependencies, publish to a private ECR repository only with approval, and pin BACKEND_IMAGE to its immutable digest. The current Spring Boot baseline is old; complete dependency/CVE review before live deployment rather than blindly migrating frameworks.
6. Store DB_PASSWORD, a cryptographically random JWT_SECRET of at least 32 bytes, MSG91_AUTH_KEY, Firebase service-account JSON, and any sensitive admin phone configuration in Secrets Manager. Grant an EC2 instance role only the exact secret ARNs and ECR/logging permissions; do not install AWS access keys. Fetch secrets into protected files outside the checkout using SSM/IAM. Avoid shell tracing and avoid printing composed environment values. Supply the remaining non-secret variables from runtime.env.example. Confirm Google OAuth audience, MSG91/DLT template and Firebase project.
7. On the instance, install Docker/Compose and deploy `backend/deploy/aws/compose.yml`. Set BACKEND_IMAGE, RUNTIME_ENV_FILE, FIREBASE_CREDENTIALS_FILE and RDS_TRUSTSTORE_FILE. Runtime env should be root-readable mode 0600; Firebase file readable only by container UID 10001 (0400); CA truststore may be read-only and is not a private key. Container runs without root, capabilities, or a writable root filesystem. Use `docker compose -f backend/deploy/aws/compose.yml config --quiet` for validation; do not print expanded secrets.
8. After explicit approval, start the service. Target group health path: `/actuator/health/readiness` port 8080, success 200. Liveness: `/actuator/health/liveness`. Readiness checks the database; details and other actuator endpoints are not publicly exposed. Wait for a healthy target, then test HTTPS externally. Native mobile requests do not require browser CORS; do not enable wildcard CORS for the untouched Flutter/web frontend. Apply ALB/WAF rate protection as appropriate; forwarded headers are trusted only because the instance accepts traffic exclusively from ALB.
9. Configure CloudWatch agent collection of rotated Docker logs, retention (proposed 30 days, confirm), ALB access logs with limited retention/access, and alarms for unhealthy targets, 5xx, latency, host/disk/memory and RDS capacity. Do not log Authorization, OTPs, request bodies, personal profiles or secrets. Review existing backend admin/FCM/Google logging before live launch. MSG91 exceptions were redacted because their URL may contain OTPs.
10. Use a separate staging database and test accounts for auth, jobs, applications, private records, push, logout and account deletion. `backend/smoke-test.sh` creates and deletes test data and assumes dev OTP; never run it on production. Test RDS restore and document RPO/RTO; back up secret/signing recovery procedures. Roll back by deploying the previous image digest after confirming database compatibility; never auto-rollback by restoring over live user data.

AWS runtime variables from application.yml: APP_ENV, DB_URL, DB_USER, DB_PASSWORD, JWT_SECRET, JWT_EXPIRY_MS, OTP_DEV_MODE, SMS_PROVIDER, MSG91_AUTH_KEY, MSG91_TEMPLATE_ID, ADMIN_PHONES, GOOGLE_CLIENT_ID, FORWARD_HEADERS, FCM_ENABLED, FCM_CREDENTIALS. The new deployment also sets SPRING_PROFILES_ACTIVE and JAVA_TOOL_OPTIONS. The old docker-compose.prod.yml remains unchanged and is NOT the recommended AWS production deployment (root DB user, local DB volume, no TLS termination).

## Google Play checklist

- Confirm ownership of `com.sanjeet.contractorjobs`, app name and existing EAS project. Confirm previous versionCode before choosing the next code.
- Provide upload signing credentials securely; enroll/confirm Play App Signing and back up recovery material. Add **Play app-signing** SHA-1/SHA-256 to Firebase/Android OAuth configuration, not only the upload-key fingerprint. Supply Google web client audience and publish OAuth consent configuration as required.
- Replace Expo placeholder app/adaptive/splash artwork with approved branding. Supply 512x512 store icon, 1024x500 feature graphic, real phone screenshots, localized title/short/full descriptions, support email and website. Existing assets were not redesigned without brand direction.
- Target Android API 36 or higher under current policy; verify the final AAB and all native dependencies, including 16 KB page-size support. Test small phones, large fonts, TalkBack, gesture navigation, keyboard and safe areas; source-level accessibility improvements do not substitute for device QA.
- Publish a reviewed privacy policy and external account-deletion request page. Backend HTML files are still templates and must not be claimed compliant. Include Google-only workers in the deletion process; do not demand a mandatory phone number from them. Confirm identity verification, response time, backup retention and any legally retained data.
- Review Data safety against actual behavior: account name/email/Google ID, optional worker phone and contractor OTP phone, city, contractor/worker profile, job posts/applications/follows, attendance/wage/overtime/payment notes, notification token, plus AdMob device identifiers, IP-derived information, interactions and diagnostics. Applicant profile/contact data is shared with the relevant contractor. Financial diary records are stored on the backend, not just locally. Confirm collection/sharing/purpose/retention with all providers; no blanket 'no data collected' claims.
- Declare ads, configure real AdMob IDs, approved UMP privacy messages and account/app readiness. Consent gates ad initialization and the account menu offers privacy options. Confirm intended audience/age restrictions and geography; child-directed handling has NOT been assumed or implemented.
- Complete content rating, target audience, app access instructions for reviewers, countries, store category, ads and data declarations. Plan job-content reporting/moderation/support and abuse handling; no user-facing reporting/blocking workflow was found. Confirm whether Play UGC policy requires additional features before launch.
- For applicable personal developer accounts created after 13 November 2023, complete at least 12 continuously opted-in closed testers for 14 days, then apply for production access. Confirm the requirements shown for your own account.
- Run internal/closed-track QA, pre-launch reports and staged rollout planning only after explicit approval. No `eas submit`, Play upload or rollout was performed.

## Device and staging acceptance

Verify contractor OTP signup/existing login, wrong/expired/rate-limited OTP, Google worker login/cancel, optional profile setup, role navigation, token expiry, process restart and offline logout. Verify job posting and numeric validation, search/page refresh while requests overlap, apply/duplicate apply, applicant permissions, following, denied/granted push and token refresh, shared-device account switching, ad consent/offline behavior/privacy choices, attendance/payment validation and account deletion. Confirm no old user's notifications arrive after logout. Offline unregistration is best effort; multi-device token ownership is limited to one token per account and needs a broader device/session model for full multi-device guarantees.

## Official references checked

- Expo SDK 58: https://docs.expo.dev/versions/v58.0.0/
- Expo environment management: https://docs.expo.dev/eas/environment-variables/
- Expo config plugins: https://docs.expo.dev/config-plugins/plugins/
- Play API policy: https://support.google.com/googleplay/android-developer/answer/11926878
- Play testing: https://support.google.com/googleplay/android-developer/answer/14151465
- AdMob disclosures: https://developers.google.com/admob/android/privacy/play-data-disclosure
- RDS TLS: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/mysql-ssl-connections.html

## Follow-up verification (14 November 2026)

The Windows prebuild stall is resolved by `scripts/prebuild.cjs`: it invokes Expo with an explicit project directory from an empty working directory and uses `--no-clean` to preserve existing native files. Asset paths resolve from app.config.js. `npm run android` runs this wrapper first. Use `APP_VARIANT=production` and all release settings before `npm run prebuild:android` for a local release.

The package override `minimatch@>=7 <11 -> 11.0.1` addresses GHSA-g3hv-75wg-m249 without downgrading Expo. Lint, type checking, the regression suite, Expo Doctor and Expo fingerprint generation passed with the override. It is intentionally scoped so older unaffected minimatch APIs are unchanged. Reassess/remove the override when upstream dependencies adopt fixed releases.

JWT authentication now checks that the account still exists and uses its current database role. Account deletion and role changes therefore take effect immediately instead of waiting for a JWT to expire. This adds a database lookup per authenticated request; database availability is required. Explicit logout still clears local credentials and push registration; server-side per-device token revocation remains a separate enhancement.

`backend/scripts/integration-smoke.cjs` is restricted to a loopback address and explicit DISPOSABLE_TEST_DATABASE=yes. It creates synthetic accounts and tests only their data, including account deletion. Never point test scripts at an existing production database.
