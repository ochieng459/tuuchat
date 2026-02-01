import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"
import { useAuth } from "../hooks/useAuth"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import UserCard from "../components/UserCard"
import { Bell } from "lucide-react"

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [publicUsers, setPublicUsers] = useState([])
  const [search, setSearch] = useState("")
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  // ---------------- FETCH USERS ----------------
  const fetchPublicUsers = async () => {
    if (!user) return
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

    const { data: unreadData } = await supabase
      .from("messages")
      .select("sender_id")
      .eq("receiver_id", user.id)
      .eq("is_read", false)

    const unreadMap = {}
    unreadData?.forEach((m) => {
      unreadMap[m.sender_id] = (unreadMap[m.sender_id] || 0) + 1
    })

    const merged = usersData.map((u) => ({
      ...u,
      unreadCount: unreadMap[u.id] || 0
    }))

    setPublicUsers(merged)
    setFilteredUsers(merged)
    setLoading(false)
  }

  // ---------------- FETCH NOTIFICATIONS ----------------
  const fetchUnreadNotifications = async () => {
    if (!user) return

    const { data } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_read", false)

    setUnreadNotifications(data?.length || 0)
  }

  // ---------------- SEARCH FILTER ----------------
  useEffect(() => {
    const value = search.trim().toLowerCase()
    if (!value) return setFilteredUsers(publicUsers)

    setFilteredUsers(
      publicUsers.filter((u) =>
        u.username.toLowerCase().includes(value)
      )
    )
  }, [search, publicUsers])

  // ---------------- REALTIME ----------------
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("home-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`
        },
        fetchPublicUsers
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`
        },
        fetchUnreadNotifications
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  // ---------------- INITIAL LOAD ----------------
  useEffect(() => {
    if (!user) return
    fetchPublicUsers()
    fetchUnreadNotifications()
  }, [user])

  // ================= UI =================

  return (
    <div className="h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 font-sans flex flex-col overflow-hidden">

      {/* ---------------- HEADER ---------------- */}
      <header className="shrink-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-3 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-3">

          {/* Left */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <button
              onClick={() => navigate("/notifications")}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center hover:scale-105 transition"
            >
              <Bell size={18} className="text-white" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                  {unreadNotifications}
                </span>
              )}
            </button>

            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              tuuChat
            </h1>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64 sm:ml-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

        </div>
      </header>

      {/* ---------------- MAIN ---------------- */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full">

        <p className="text-gray-400 text-sm mb-6">
          {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"} found
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-400">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No users found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-6">
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

      {/* ---------------- FOOTER ---------------- */}
      <div className="shrink-0 bg-gray-900/80 backdrop-blur-md border-t border-gray-800">
        <Navbar />
      </div>

    </div>
  )
}
