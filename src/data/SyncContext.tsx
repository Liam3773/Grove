import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { User } from 'firebase/auth'
import { useAppData } from './AppDataContext'
import { firebaseConfigured } from '../lib/firebase'
import { isAuthAvailable, subscribeToAuthChanges, registerWithEmail, loginWithEmail, logout } from '../lib/sync/authService'
import { isSyncAvailable, fetchRemoteData, pushLocalData } from '../lib/sync/firestoreSync'
import { mergeAppData, hasLocalContent } from '../lib/sync/mergeAppData'
import { clearUnauthDatabase } from './dataStore'
import type { AppData } from '../types'

/**
 * SyncContext.tsx
 *
 * Bridges the local-first AppDataContext with the optional Firebase account
 * layer (lib/sync/*). This is the only place that decides *when* to sync —
 * the actual auth/Firestore calls live in lib/sync so this file stays about
 * orchestration and state, not I/O.
 *
 * Grove keeps working fully offline and without an account at every step:
 * if Firebase isn't configured, or a call fails, we fall back to `local`/
 * `error` status and never block anything the user is doing.
 */

export type SyncStatus = 'disabled' | 'signed-out' | 'offline' | 'local' | 'syncing' | 'synced' | 'error'

interface SyncCtx {
  available: boolean
  user: User | null
  authLoading: boolean
  /** True while the post-sign-in fetch/merge is in flight. App.tsx waits on
   *  this (in addition to authLoading) before deciding whether to route a
   *  signed-in user into onboarding, so a returning user's cloud Grove has a
   *  chance to load before that decision is made. */
  initializing: boolean
  status: SyncStatus
  errorMessage: string | null
  pendingMerge: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOutUser: () => Promise<void>
  syncNow: () => Promise<void>
  confirmMergeLocal: () => Promise<void>
  dismissMerge: () => void
}

const Ctx = createContext<SyncCtx | null>(null)

const AUTO_SYNC_DEBOUNCE_MS = 3000

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { data, importData, switchUser } = useAppData()

  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [phase, setPhase] = useState<'local' | 'syncing' | 'synced' | 'error'>('local')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pendingMerge, setPendingMerge] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [initializing, setInitializing] = useState(false)

  const dataRef = useRef(data)
  useEffect(() => {
    dataRef.current = data
  }, [data])

  const available = firebaseConfigured && isAuthAvailable() && isSyncAvailable()

  // ---------- Track online/offline ----------
  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const localSnapshotRef = useRef<AppData | null>(null)

  // ---------- Auth subscription ----------
  useEffect(() => {
    let active = true

    const unsubscribe = subscribeToAuthChanges((nextUser) => {
      // Must async/await inside to guarantee we switch user context
      const handleAuthChange = async () => {
        const snapshot = await switchUser(nextUser?.uid ?? null)

        if (!active) return

        if (snapshot) {
          localSnapshotRef.current = snapshot
        } else if (!nextUser) {
          localSnapshotRef.current = null
        }

        setUser(nextUser)
        setAuthLoading(false)

        if (nextUser) {
          // Instead of waiting for a separate useEffect to notice `user` changed
          // and then setting `initializing = true`, which allows a render to slip
          // through where `user` is set but `initializing` is false (causing App.tsx
          // to briefly think the account is settled and redirect to /onboarding),
          // we set it synchronously here.
          setInitializing(true)
        } else {
          setPhase('local')
          setPendingMerge(false)
          setErrorMessage(null)
          setInitializing(false)
        }
      }

      handleAuthChange()
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [switchUser])

  // ---------- First sync after sign-in ----------
  const prevUidRef = useRef<string | null>(null)
  useEffect(() => {
    if (!user || !available) {
      prevUidRef.current = null
      return
    }
    if (prevUidRef.current === user.uid) return // already handled this session
    prevUidRef.current = user.uid

    let cancelled = false
    async function initialSync(uid: string) {
      setPhase('syncing')
      setErrorMessage(null)
      // (initializing is already true from the auth listener, but we ensure it here too)
      setInitializing(true)
      try {
        const remote = await fetchRemoteData(uid)
        if (cancelled) return

        if (remote === null) {
          if (localSnapshotRef.current && hasLocalContent(localSnapshotRef.current)) {
            // First time this account has connected anywhere — let the
            // person decide what to do with what's already on this device.
            setPendingMerge(true)
            setPhase('local')
            return
          }
          await pushLocalData(uid, dataRef.current)
          if (!cancelled) setPhase('synced')
          return
        }

        const snapshot = localSnapshotRef.current ?? dataRef.current
        const merged = mergeAppData(snapshot, remote)
        await importData(JSON.stringify(merged))
        await pushLocalData(uid, merged)
        if (localSnapshotRef.current) {
          await clearUnauthDatabase()
          localSnapshotRef.current = null
        }
        if (!cancelled) setPhase('synced')
      } catch (error) {
        console.error('Grove: initial sync failed, continuing locally.', error)
        if (!cancelled) {
          setErrorMessage('Couldn\u2019t reach your account. Grove is still saving on this device.')
          setPhase('error')
        }
      } finally {
        if (!cancelled) setInitializing(false)
      }
    }

    initialSync(user.uid)
    return () => {
      cancelled = true
    }
  }, [user, available, importData])

  // ---------- Background auto-sync after local edits ----------
  useEffect(() => {
    if (!user || !available || pendingMerge) return
    if (phase !== 'synced' && phase !== 'error') return // wait for the baseline sync to finish first
    if (!isOnline) return

    const handle = setTimeout(() => {
      pushLocalData(user.uid, dataRef.current)
        .then(() => setPhase('synced'))
        .catch((error) => {
          console.error('Grove: background sync failed, continuing locally.', error)
          setErrorMessage('Couldn\u2019t reach your account. Grove is still saving on this device.')
          setPhase('error')
        })
    }, AUTO_SYNC_DEBOUNCE_MS)

    return () => clearTimeout(handle)
  }, [data, user, available, isOnline, pendingMerge, phase])

  // ---------- Public actions ----------
  const signUp = useCallback(async (email: string, password: string) => {
    await registerWithEmail(email, password)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    await loginWithEmail(email, password)
  }, [])

  const signOutUser = useCallback(async () => {
    await logout()
  }, [])

  const syncNow = useCallback(async () => {
    if (!user || !available) return
    setPhase('syncing')
    setErrorMessage(null)
    try {
      const remote = await fetchRemoteData(user.uid)
      const merged = mergeAppData(dataRef.current, remote)
      await importData(JSON.stringify(merged))
      await pushLocalData(user.uid, merged)
      setPhase('synced')
    } catch (error) {
      console.error('Grove: manual sync failed, continuing locally.', error)
      setErrorMessage('Couldn\u2019t reach your account. Grove is still saving on this device.')
      setPhase('error')
    }
  }, [user, available, importData])

  const confirmMergeLocal = useCallback(async () => {
    if (!user) return
    setPhase('syncing')
    setErrorMessage(null)
    try {
      if (localSnapshotRef.current) {
        const merged = mergeAppData(localSnapshotRef.current, dataRef.current)
        await importData(JSON.stringify(merged))
        await pushLocalData(user.uid, merged)
        await clearUnauthDatabase()
        localSnapshotRef.current = null
      } else {
        await pushLocalData(user.uid, dataRef.current)
      }
      setPhase('synced')
    } catch (error) {
      console.error('Grove: syncing existing local grove failed.', error)
      setErrorMessage('Couldn\u2019t reach your account. Grove is still saving on this device.')
      setPhase('error')
    } finally {
      setPendingMerge(false)
    }
  }, [user, importData])

  const dismissMerge = useCallback(() => {
    setPendingMerge(false)
    setPhase('local')
    localSnapshotRef.current = null
  }, [])

  const status: SyncStatus = useMemo(() => {
    if (!available) return 'disabled'
    if (!user) return 'signed-out'
    if (!isOnline) return 'offline'
    return phase
  }, [available, user, isOnline, phase])

  const value: SyncCtx = {
    available, user, authLoading, initializing, status, errorMessage, pendingMerge,
    signUp, signIn, signOutUser, syncNow, confirmMergeLocal, dismissMerge,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSync(): SyncCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSync must be used within SyncProvider')
  return ctx
}
