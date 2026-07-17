# Deploying Cloud Functions (mergeBackup)

This folder contains a code-only example of a Cloud Function that performs server-side merging of a TempleBackupData payload into Firestore. It's intended as a helper to reduce conflicts and centralize merge logic.

How to deploy (local):

1. Install Firebase CLI and dependencies

```bash
npm install -g firebase-tools
cd functions
npm install
```

2. Login and select project

```bash
firebase login
firebase use --add
```

3. Deploy the function

```bash
firebase deploy --only functions:mergeBackup
```

Security notes:
- Protect this endpoint using authentication (e.g., Firebase Auth + callable functions or IAM). The example is intentionally simple; do not expose it publicly without proper auth.
- Consider validating payload size and rate-limiting.
