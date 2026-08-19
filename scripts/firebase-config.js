/* Cross-device progress sync for the Study Plan (optional, free).
 *
 * Paste your Firebase Web app config below (Firebase Console →
 * Project settings → General → "Your apps" → SDK setup → Config).
 *
 * The web apiKey is NOT a secret — it only identifies the project and is
 * safe to commit to a public repo. Access is controlled by Firestore
 * Security Rules (see the setup notes), not by hiding this key.
 *
 * Until real values are filled in, the Study Plan just uses this browser's
 * local storage (no sync) — nothing breaks.
 */
window.PREP_FIREBASE_CONFIG = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};
