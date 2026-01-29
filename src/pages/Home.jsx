import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"
import { useAuth } from "../hooks/useAuth"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import UserCard from "../components/UserCard"

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [publicUsers, setPublicUsers] = useState([])
  const [search, setSearch] = useState("")
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // --- Fetch Public Users + Unread Count ---
  const fetchPublicUsers = async () => {
    setLoading(true)
    const { data: usersData, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .neq("id", user.id)
      .order("username", { ascending: true })
    
    if (error) {
      console.error(error.message)
      setLoading(false)
      return
    }

    // Fetch unread messages
    const { data: unreadData } = await supabase
      .from("messages")
      .select("sender_id")
      .eq("receiver_id", user.id)
      .eq("is_read", false)

    const unreadMap = {}
    unreadData?.forEach((m) => {
      unreadMap[m.sender_id] = (unreadMap[m.sender_id] || 0) + 1
    })

    const mergedUsers = usersData.map((u) => ({
      ...u,
      unreadCount: unreadMap[u.id] || 0
    }))

    setPublicUsers(mergedUsers)
    setFilteredUsers(mergedUsers)
    setLoading(false)
  }

  // --- Search Filter ---
  useEffect(() => {
    const value = search.trim().toLowerCase()
    if (!value) return setFilteredUsers(publicUsers)
    setFilteredUsers(publicUsers.filter((u) => u.username.toLowerCase().includes(value)))
  }, [search, publicUsers])

  // --- Realtime Unread Updates ---
  useEffect(() => {
    const channel = supabase
      .channel("home-unread-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
        () => fetchPublicUsers()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  // --- Initial Fetch ---
  useEffect(() => {
    fetchPublicUsers()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
              <span className="font-bold text-lg">t</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              tuuChat
            </h1>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-64 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-300 mb-2">Active Conversations</h2>
          <p className="text-gray-400 text-sm">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-400">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">No users found</p>
            {search && (
              <p className="text-gray-500 mt-2">Try a different search term</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredUsers.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                onClick={() => navigate(`/chat/${u.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Navbar fixed at bottom */}
      <Navbar />
    </div>
  )
}