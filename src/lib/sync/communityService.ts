import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'

export interface UserProfile {
  uid: string
  username: string
  usernameLower: string
  totalStudyMinutes: number
}

export interface FriendRequest {
  id: string
  senderUid: string
  receiverUid: string
  senderUsername: string
  status: 'pending'
  createdAt: any
}

export interface Friendship {
  id: string
  users: string[] // [uid1, uid2]
  createdAt: any
}

// ---------------- Usernames & Profiles ----------------

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  if (!db) return false
  const docRef = doc(db, 'usernames', username.toLowerCase())
  const snap = await getDoc(docRef)
  return !snap.exists()
}

export async function claimUsername(uid: string, username: string): Promise<void> {
  if (!db) return
  const normalized = username.toLowerCase()

  // Create username reservation
  await setDoc(doc(db, 'usernames', normalized), { uid })

  // Set initial profile
  await setDoc(doc(db, 'profiles', uid), {
    uid,
    username: username,
    usernameLower: normalized,
    totalStudyMinutes: 0
  }, { merge: true })
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null
  const snap = await getDoc(doc(db, 'profiles', uid))
  if (snap.exists()) {
    return snap.data() as UserProfile
  }
  return null
}

export async function searchUsers(queryStr: string): Promise<UserProfile[]> {
  if (!db || !queryStr.trim()) return []
  // Simplistic prefix search using normalized username
  const normalizedQuery = queryStr.toLowerCase()
  const q = query(
    collection(db, 'profiles'),
    where('usernameLower', '>=', normalizedQuery),
    where('usernameLower', '<=', normalizedQuery + '\uf8ff'),
    limit(10)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as UserProfile)
}

// ---------------- Friend Requests ----------------

export async function sendFriendRequest(senderUid: string, senderUsername: string, receiverUid: string): Promise<void> {
  if (!db) return

  // Check if they are already friends
  const friendshipQ = query(
    collection(db, 'friendships'),
    where('users', 'array-contains', senderUid)
  )
  const friendshipSnap = await getDocs(friendshipQ)
  const alreadyFriends = friendshipSnap.docs.some(d => (d.data() as Friendship).users.includes(receiverUid))
  if (alreadyFriends) throw new Error('Already friends.')

  const reqId = `${senderUid}_${receiverUid}`
  await setDoc(doc(db, 'friendRequests', reqId), {
    id: reqId,
    senderUid,
    receiverUid,
    senderUsername,
    status: 'pending',
    createdAt: serverTimestamp()
  })
}

export async function getPendingFriendRequests(uid: string): Promise<FriendRequest[]> {
  if (!db) return []
  const q = query(
    collection(db, 'friendRequests'),
    where('receiverUid', '==', uid),
    where('status', '==', 'pending')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as FriendRequest)
}

export async function acceptFriendRequest(request: FriendRequest): Promise<void> {
  if (!db) return
  const { senderUid, receiverUid, id } = request

  // Create friendship
  const friendshipId = senderUid < receiverUid ? `${senderUid}_${receiverUid}` : `${receiverUid}_${senderUid}`
  await setDoc(doc(db, 'friendships', friendshipId), {
    id: friendshipId,
    users: [senderUid, receiverUid],
    createdAt: serverTimestamp()
  })

  // Delete request
  await deleteDoc(doc(db, 'friendRequests', id))
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
  if (!db) return
  await deleteDoc(doc(db, 'friendRequests', requestId))
}

export async function getFriends(uid: string): Promise<UserProfile[]> {
  if (!db) return []
  const q = query(collection(db, 'friendships'), where('users', 'array-contains', uid))
  const snap = await getDocs(q)
  const friendUids = snap.docs.map(d => {
    const f = d.data() as Friendship
    return f.users.find(u => u !== uid)!
  }).filter(Boolean)

  if (friendUids.length === 0) return []

  // Fetch profiles for friends in chunks of 10 (Firestore IN limit)
  const profiles: UserProfile[] = []
  for (let i = 0; i < friendUids.length; i += 10) {
    const chunk = friendUids.slice(i, i + 10)
    const pq = query(collection(db, 'profiles'), where('uid', 'in', chunk))
    const pSnap = await getDocs(pq)
    profiles.push(...pSnap.docs.map(d => d.data() as UserProfile))
  }
  return profiles
}

// ---------------- Leaderboard ----------------

export async function getGlobalLeaderboard(): Promise<UserProfile[]> {
  if (!db) return []
  const q = query(
    collection(db, 'profiles'),
    orderBy('totalStudyMinutes', 'desc'),
    limit(50)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as UserProfile)
}

export async function getFriendsLeaderboard(uid: string): Promise<UserProfile[]> {
  const friends = await getFriends(uid)
  const me = await getUserProfile(uid)
  const list = [...friends]
  if (me) list.push(me)

  return list.sort((a, b) => b.totalStudyMinutes - a.totalStudyMinutes)
}
