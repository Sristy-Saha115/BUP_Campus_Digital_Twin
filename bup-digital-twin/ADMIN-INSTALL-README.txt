BUP Digital Twin — Admin integration package (consultation READ-ONLY)

This package is adapted from the user-provided Claude files.
Unlike Claude original: Admin cancellation API and UI have been removed.
Bookings now show stored cancellation actor and timestamps where available.
Existing Student/Faculty booking workflows are left unchanged except restricting /mine and booking creation to students.

From the Git repository root (the folder containing client/ and server/):
1. Ensure clean git status; create a new branch: git switch -c admin-feature
2. BACK UP the existing project and database before modifying files.
3. Extract THIS zip into the repository root, maintaining paths. It replaces 3 existing files:
   server/middleware/auth.js, server/routes/auth.js, client/src/auth.jsx, client/src/pages/Login.jsx
   (Actually 4 files.) Other paths are new.
4. Run: node apply-admin-integration.js
5. Review: git diff and git status
6. Configure server/.env (DO NOT COMMIT SECRETS): JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, FACULTY_SIGNUP_CODE.
7. Install dependencies as needed: npm install --prefix server; npm install --prefix client
8. Run: npm run build --prefix client ; npm run dev
9. Manually test Admin/Student/Faculty roles and protected APIs.

IMPORTANT:
- The original Claude test file has been excluded because it targets an Admin cancellation action that is intentionally removed. Tests need updating before use.
- Do not run npm run seed after admin begins adding records: it can reset database data.
- This archive is a source patch, not a complete project. Do NOT overwrite the project with only this archive.
- Not runtime/integration tested against a live MongoDB environment here.
