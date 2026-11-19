# AWS backend preparation

See `mobile_app/RELEASE.md` for the deployment sequence. These files do not provision or deploy AWS resources.

## Initial database schema

`schema-baseline.sql` contains schema only, exported from the current application's entity model on an isolated MySQL 8.0.46 database. It contains no user records, credentials, DROP statements or data-reset operations. It is intended **only for a new, empty database**. Review it against the chosen RDS MySQL version and test on staging before applying it.

After explicit deployment approval, a migration operator can apply it from a trusted host with private database access, using a separate migration identity and TLS. For example, on Linux:

```bash
mysql --ssl-mode=VERIFY_IDENTITY --ssl-ca=/secure/path/rds-ca.pem \
  --host=RDS_ENDPOINT --user=MIGRATION_USER --password contractor_app \
  < backend/deploy/aws/schema-baseline.sql
```

The password is prompted, not stored in shell history. The database itself must already exist. Do not use this file to upgrade an existing database: write and review incremental migrations against its actual schema and backup first. Do not enable `baseline-on-migrate` or Hibernate schema updates as a substitute for reconciliation.

The production profile uses Hibernate `validate`; the runtime database identity needs data access, not schema modification permissions. The baseline has no automatic migration runner. Track schema versions and establish reviewed incremental migrations before future releases.

## Local integration verification

The integration test requires Node.js, a separately running disposable MySQL-backed service, and explicit opt-in:

```powershell
$env:DISPOSABLE_TEST_DATABASE='yes'
$env:BASE_URL='http://127.0.0.1:18080'
node backend/scripts/integration-smoke.cjs
```

It creates synthetic test accounts, exercises application workflows, and deletes only accounts it created. Never run development OTP mode, the test login route, or insecure local database settings on AWS production. Local schema verification does not verify RDS TLS, availability, backups or external integrations.
