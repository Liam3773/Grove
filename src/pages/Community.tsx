import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Users, Search, UserPlus, UserCheck, UserX, Loader2 } from 'lucide-react'
import { PageHeader, Card, Button } from '../components/ui'
import { useSync } from '../data/SyncContext'
import {
  getGlobalLeaderboard, getFriendsLeaderboard, getFriends, getPendingFriendRequests,
  searchUsers, sendFriendRequest, acceptFriendRequest, rejectFriendRequest
} from '../lib/sync/communityService'
import type { UserProfile, FriendRequest } from '../lib/sync/communityService'

type Tab = 'leaderboard' | 'friends'
type LeaderboardScope = 'global' | 'friends'

export default function Community() {
  const navigate = useNavigate()
  const { user, available } = useSync()
  const [activeTab, setActiveTab] = useState<Tab>('leaderboard')

  if (!available || !user) {
    return (
      <div className="animate-rise">
        <PageHeader title="Community" back="/" />
        <Card className="py-10 text-center">
          <p className="text-sm text-mist-400 mb-4">
            Sign in to access leaderboards and add friends.
          </p>
          <Button variant="secondary" onClick={() => navigate('/account')}>
            Go to Account
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-rise pb-24">
      <PageHeader title="Community" back="/" />

      <div className="mb-6 flex rounded-xl bg-earth-900 p-1">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'leaderboard' ? 'bg-moss-500 text-earth-950' : 'text-mist-400'}`}
        >
          <Trophy size={16} /> Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'friends' ? 'bg-moss-500 text-earth-950' : 'text-mist-400'}`}
        >
          <Users size={16} /> Friends
        </button>
      </div>

      {activeTab === 'leaderboard' ? <LeaderboardView uid={user.uid} /> : <FriendsView uid={user.uid} />}
    </div>
  )
}

function LeaderboardView({ uid }: { uid: string }) {
  const [scope, setScope] = useState<LeaderboardScope>('global')
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([])

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const data = scope === 'global' ? await getGlobalLeaderboard() : await getFriendsLeaderboard(uid)
        if (active) setLeaderboard(data)
      } catch (err) {
        console.error(err)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [scope, uid])

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Button variant={scope === 'global' ? 'primary' : 'secondary'} className="flex-1 py-1.5 text-xs" onClick={() => setScope('global')}>Global</Button>
        <Button variant={scope === 'friends' ? 'primary' : 'secondary'} className="flex-1 py-1.5 text-xs" onClick={() => setScope('friends')}>Friends</Button>
      </div>

      <Card className="min-h-[300px]">
        {loading ? (
          <div className="flex h-full items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-mist-500" />
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-center text-sm text-mist-500 py-10">No users found.</p>
        ) : (
          <div className="divide-y divide-earth-800">
            {leaderboard.map((u, i) => (
              <div key={u.uid} className={`flex items-center justify-between py-3 ${u.uid === uid ? 'bg-moss-500/10 -mx-4 px-4 rounded-lg' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-6 text-center ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-700' : 'text-mist-600'}`}>
                    #{i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-mist-100">{u.username}</p>
                    {u.uid === uid && <p className="text-[10px] uppercase text-moss-400">You</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-mist-100">{Math.round((u.totalStudyMinutes || 0) / 60 * 10) / 10}</p>
                  <p className="text-[10px] uppercase text-mist-500">hours</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function FriendsView({ uid }: { uid: string }) {
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [searching, setSearching] = useState(false)

  const [friends, setFriends] = useState<UserProfile[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFriends()
  }, [])

  async function loadFriends() {
    try {
      const [fList, rList] = await Promise.all([
        getFriends(uid),
        getPendingFriendRequests(uid)
      ])
      setFriends(fList)
      setRequests(rList)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!search.trim()) return
    setSearching(true)
    try {
      const results = await searchUsers(search.trim())
      setSearchResults(results.filter(u => u.uid !== uid)) // Don't show self
    } catch (err) {
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  async function handleSendRequest(user: UserProfile) {
    try {
      // Pass a dummy username for sender since we don't fetch our own username in Context easily.
      // Ideally we'd have our own profile, but we can just use the email or "Someone" if needed.
      // We will look up our own profile just for the request.
      const { getUserProfile } = await import('../lib/sync/communityService')
      const me = await getUserProfile(uid)
      if (!me) return

      await sendFriendRequest(uid, me.username, user.uid)
      alert(`Friend request sent to ${user.username}!`)
    } catch (err: any) {
      alert(err.message || 'Could not send request.')
    }
  }

  async function handleAccept(req: FriendRequest) {
    await acceptFriendRequest(req)
    loadFriends()
  }

  async function handleReject(req: FriendRequest) {
    await rejectFriendRequest(req.id)
    loadFriends()
  }

  if (loading) {
    return (
      <Card className="py-10 text-center flex justify-center">
        <Loader2 className="animate-spin text-mist-500" />
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-mist-600">Find Friends</p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-mist-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search username"
              className="w-full rounded-lg border border-earth-700 bg-earth-900 py-2 pl-9 pr-3 text-sm text-mist-100 placeholder-mist-600 focus:outline-none"
            />
          </div>
          <Button type="submit" disabled={searching}>Search</Button>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map(u => (
              <div key={u.uid} className="flex items-center justify-between rounded-lg bg-earth-900 px-3 py-2">
                <span className="text-sm font-medium text-mist-200">{u.username}</span>
                <button onClick={() => handleSendRequest(u)} className="text-moss-400 hover:text-moss-300 p-1">
                  <UserPlus size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {requests.length > 0 && (
        <Card className="border-amber-400/30 bg-amber-400/5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-500">Pending Requests</p>
          <div className="space-y-2">
            {requests.map(req => (
              <div key={req.id} className="flex items-center justify-between rounded-lg bg-earth-950/50 px-3 py-2">
                <span className="text-sm font-medium text-amber-100">{req.senderUsername}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleAccept(req)} className="text-moss-400 p-1 bg-moss-500/10 rounded">
                    <UserCheck size={16} />
                  </button>
                  <button onClick={() => handleReject(req)} className="text-red-400 p-1 bg-red-500/10 rounded">
                    <UserX size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-mist-600">My Friends ({friends.length})</p>
        {friends.length === 0 ? (
          <p className="text-sm text-mist-500 py-4">You haven't added any friends yet.</p>
        ) : (
          <div className="space-y-2">
            {friends.map(f => (
              <div key={f.uid} className="flex items-center justify-between rounded-lg bg-earth-900 px-3 py-2">
                <span className="text-sm font-medium text-mist-200">{f.username}</span>
                <div className="text-right">
                  <p className="text-xs text-mist-400">{Math.round((f.totalStudyMinutes || 0)/60)}h studied</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
