import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { getStorage } from 'firebase/storage'

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Mangler miljøvariabel ${name} — se .env.example`)
  }
  return value
}

const env = import.meta.env

const firebaseConfig = {
  apiKey: requireEnv('VITE_FIREBASE_API_KEY', env.VITE_FIREBASE_API_KEY),
  authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN', env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: requireEnv('VITE_FIREBASE_PROJECT_ID', env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: requireEnv('VITE_FIREBASE_STORAGE_BUCKET', env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: requireEnv(
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  ),
  appId: requireEnv('VITE_FIREBASE_APP_ID', env.VITE_FIREBASE_APP_ID),
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
// Rejsedata gemmes også på enheden (IndexedDB), så appen kan vises uden
// forbindelse — på en rejse er det ofte netop dér, man har brug for den.
// Ændringer lavet offline sendes, når forbindelsen er tilbage.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
export const storage = getStorage(app)
/** Cloud Functions ligger i europe-west1 (se functions/src/index.ts). */
export const functions = getFunctions(app, 'europe-west1')
