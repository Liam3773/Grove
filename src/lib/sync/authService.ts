import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '../firebase'

/**
 * authService.ts
 *
 * Thin wrapper around Firebase Auth. This is the only file that imports
 * from 'firebase/auth' — everything else (SyncContext, Settings UI) goes
 * through the functions below, so swapping auth providers later only means
 * touching this one file.
 */

export function isAuthAvailable(): boolean {
  return auth !== null
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

function friendlyAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists for that email — try signing in instead.'
    case 'auth/invalid-email':
      return 'That email address doesn\u2019t look right.'
    case 'auth/weak-password':
      return 'Choose a password with at least 6 characters.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.'
    case 'auth/too-many-requests':
      return 'Too many attempts — please wait a moment and try again.'
    case 'auth/network-request-failed':
      return 'No connection — Grove will keep working locally until you\u2019re back online.'
    default:
      return 'Something went wrong with your account. Grove will keep working locally.'
  }
}

export async function registerWithEmail(email: string, password: string): Promise<User> {
  if (!auth) throw new Error('Account sync isn\u2019t available right now.')
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    return cred.user
  } catch (error) {
    throw new Error(friendlyAuthError(error))
  }
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  if (!auth) throw new Error('Account sync isn\u2019t available right now.')
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  } catch (error) {
    throw new Error(friendlyAuthError(error))
  }
}

export async function logout(): Promise<void> {
  if (!auth) return
  await signOut(auth)
}
