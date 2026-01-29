import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"
import { useAuth } from "../hooks/useAuth"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import GroupCard from "../components/GroupCard"
import {
  Users,
  Search,
  Plus,
  X,
  Filter,
  MessageSquare,
  Shield,
  Calendar,
  Loader2,
  AlertCircle,
  UserPlus
} from "lucide-react"

export default function Groups() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [groups, setGroups] = useState([])
  const [search, setSearch] = useState("")
  const [filteredGroups, setFilteredGroups] = useState([])
  const [loading, setLoading] = useState(true)

  const [showCreate, setShowCreate] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [creating, setCreating] = useState(false)

  // 🔹 Fetch groups user belongs to
  const fetchGroups = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("group_members")
      .select("group:groups(*)")
      .eq("user_id", user.id)

    if (error) {
      console.error(error.message)
      setLoading(false)
      return
    }

    const mapped = data.map((item) => item.group)
    setGroups(mapped)
    setFilteredGroups(mapped)
    setLoading(false)
  }

  // 🔹 Create group
  const createGroup = async (e) => {
    e?.preventDefault()
    if (!groupName.trim()) return

    setCreating(true)

    // 1️⃣ Create group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name: groupName.trim(),
        bio: groupDescription.trim(),
        created_by: user.id
      })
      .select()
      .single()

    if (groupError) {
      console.error(groupError.message)
      alert("Failed to create group")
      setCreating(false)
      return
    }

    // 2️⃣ Add creator as admin
    const { error: memberError } = await supabase
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: "admin"
      })

    if (memberError) {
      console.error(memberError.message)
    }

    // 3️⃣ Reset + refresh
    setGroupName("")
    setGroupDescription("")
    setShowCreate(false)
    setCreating(false)
    fetchGroups()
    navigate(`/group/${group.id}`) // Navigate to the new group
  }

  // 🔹 Search filter
  useEffect(() => {
    const value = search.trim().toLowerCase()
    if (!value) return setFilteredGroups(groups)
    setFilteredGroups(
      groups.filter((g) => g.name.toLowerCase().includes(value))
    )
  }, [search, groups])

  // 🔹 Initial fetch
  useEffect(() => {
    fetchGroups()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Groups</h1>
              <p className="text-xs text-gray-400">
                {groups.length} group{groups.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-48 sm:w-64 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Group</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </header>

      {/* Stats & Filters */}
      <div className="px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Groups</p>
                  <p className="text-2xl font-bold text-white">{groups.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Active Chats</p>
                  <p className="text-2xl font-bold text-white">
                    {groups.filter(g => g.is_active !== false).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Admin Groups</p>
                  <p className="text-2xl font-bold text-white">
                    {groups.filter(g => g.created_by === user.id).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Groups list */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-purple-400" />
              Your Groups
            </h2>
            <div className="text-sm text-gray-400">
              Showing {filteredGroups.length} of {groups.length}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
              <p className="text-gray-300">Loading your groups...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">
                {search ? "No groups found" : "No groups yet"}
              </p>
              <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                {search 
                  ? "Try a different search term or create a new group"
                  : "Create your first group to start chatting with multiple people"
                }
              </p>
              {!search && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Group
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  onClick={() => navigate(`/group/${g.id}`)}
                  onChatClick={() => navigate(`/group-chat/${g.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Group Modal */}
      {showCreate && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !creating && setShowCreate(false)}
        >
          <div 
            className="bg-gray-800/90 backdrop-blur-md rounded-2xl border border-gray-700 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-6 h-6 text-purple-400" />
                  <h2 className="text-xl font-semibold text-white">Create New Group</h2>
                </div>
                <button
                  onClick={() => !creating && setShowCreate(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  disabled={creating}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-400">
                Create a group to chat with multiple people at once
              </p>
            </div>

            <form onSubmit={createGroup} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Group Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Team Chat, Family Group, Friends"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  disabled={creating}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="What's this group about?"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none h-24"
                  disabled={creating}
                />
              </div>

              <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-white mb-1">You'll be the Admin</h4>
                    <p className="text-xs text-gray-400">
                      As the creator, you'll have full control over group settings,
                      members, and permissions.
                    </p>
                  </div>
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={() => !creating && setShowCreate(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl font-medium transition-colors"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  onClick={createGroup}
                  disabled={creating || !groupName.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Create Group
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Footer with Navbar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md border-t border-gray-800 z-20">
        <Navbar />
      </footer>
    </div>
  )
}