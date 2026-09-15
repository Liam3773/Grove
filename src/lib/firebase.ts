import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

/**
 * firebase.ts
 *
 * Single place that talks to the Firebase SDK config. Grove is local-first
 * by design (see dataStore.ts) — account sync is an optional layer on top,
 * so everything here is written to fail soft: if env vars are missing or
 * initialization throws, `auth` and `db` stay null and the rest of the app
 * (authService.ts, sync/) treats that as "sync unavailable" rather than
 * crashing. Nothing about local usage depends on this module succeeding.
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
)

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

if (firebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
  } catch (error) {
    console.error('Grove: Firebase failed to initialize. Continuing in local-only mode.', error)
    app = null
    auth = null
    db = null
  }
} else {
  console.warn('Grove: Firebase env vars are not set. Account sync is disabled — Grove still works fully offline.')
}

export { app, auth, db, firebaseConfigured }
