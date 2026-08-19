/* Cross-device progress sync for the Study Plan (optional, free).
 *
 * These are the Firebase Web app config values (Console → Project settings →
 * General → "Your apps"). The web apiKey is NOT a secret — it only identifies
 * the project and is safe to commit to a public repo. Access is controlled by
 * Firestore Security Rules (auth + your personal sync code), not by hiding it.
 */
window.PREP_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAfvrQUKljqdx6XA7oo_gkSMDJwBPC4f24",
  authDomain: "prepv1-fcc1e.firebaseapp.com",
  projectId: "prepv1-fcc1e",
  storageBucket: "prepv1-fcc1e.firebasestorage.app",
  messagingSenderId: "975243435508",
  appId: "1:975243435508:web:7024398c932044fc27eda1"
};
