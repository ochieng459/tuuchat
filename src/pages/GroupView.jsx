import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../services/supabase"
import avatarPlaceholder from "../assets/avatar-placeholder.png";
import {
  ArrowLeft,
  Users,
  UserCog,
  MessageCircle,
  LogOut,
  Calendar,
  Shield,
  MoreVertical,
  User,
  Mail,
  Phone,
  Globe,
  Lock
} from "lucide-react"

export default function GroupView() {
  const { id: groupId } = useParams()
  const navigate = useNavigate()

  const [group, setGroup] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchGroup()
  }, [groupId])

  async function fetchGroup() {
    setLoading(true)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id)

    // 1. Fetch group
    const { data: groupData, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single()

    if (groupError) {
      console.error(groupError)
      setLoading(false)
      return
    }

    setGroup(groupData)

    // Check if current user is admin
    setIsAdmin(user?.id === groupData.created_by)

    // 2. Fetch admin profile
    const { data: adminData } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, created_at, is_online")
      .eq("id", groupData.created_by)
      .single()

    setAdmin(adminData)

    // 3. Fetch members
    const { data: membersData } = await supabase
      .from("group_members")
      .select(`
        user_id,
        profiles (
          id,
          username,
          avatar_url,
          is_online,
          created_at
        )
      `)
      .eq("group_id", groupId)

    setMembers(membersData || [])
    setLoading(false)
  }

  async function leaveGroup() {
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id)

    navigate("/groups")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading group...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100">
      {/* Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 text-red-500">
                <LogOut className="w-full h-full" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Leave Group</h3>
              <p className="text-gray-400">
                Are you sure you want to leave "{group.name}"? You'll need to be re-invited to join again.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={leaveGroup}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all"
              >
                Leave Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            
          </button>
          
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {group.name}
          </h1>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/group-chat/${groupId}`)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </button>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Leave Group"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Group Info Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-gray-700">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            {/* Group Avatar */}
            <div className="relative">
              <img
                src={group.avatar_url || avatarPlaceholder}
                className="w-40 h-40 rounded-2xl border-4 border-purple-500/30 object-cover"
                alt={group.name}
              />
              <div className="absolute -bottom-3 -right-3 bg-gray-900 p-2 rounded-full border-2 border-gray-800">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
            </div>

            {/* Group Details */}
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{group.name}</h2>
                  <div className="flex items-center gap-4 text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {members.length + 1} members
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Created {new Date(group.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Admin-only buttons */}
                {isAdmin && (
                  <div className="mt-4 lg:mt-0 flex gap-3">
                    <button
                      onClick={() => navigate("/profile")}

                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <UserCog className="w-4 h-4" />
                      Settings
                    </button>
                    
                  </div>
                )}
              </div>

              {/* Group Bio */}
              {group.bio && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">About This Group</h3>
                  <p className="text-gray-300 text-lg leading-relaxed">{group.bio}</p>
                </div>
              )}

              {/* Group Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-900/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Users className="w-4 h-4" />
                    <span className="text-xs">Members</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{members.length + 1}</p>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Globe className="w-4 h-4" />
                    <span className="text-xs">Visibility</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    {group.is_public ? 'Public' : 'Private'}
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Lock className="w-4 h-4" />
                    <span className="text-xs">Access</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    {group.requires_approval ? 'Approval Required' : 'Open'}
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">Created</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    {new Date(group.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Admin Card */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Group Admin</h3>
              </div>

              {admin && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-xl">
                    <div className="relative">
                      <img
                        src={admin.avatar_url || "https://via.placeholder.com/48"}
                        className="w-14 h-14 rounded-full border-2 border-purple-500/30 object-cover"
                        alt={admin.username}
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${
                        admin.is_online ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{admin.username}</h4>
                      <p className="text-xs text-gray-400">
                        {admin.is_online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                    {isAdmin && (
                      <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-medium">
                        You
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => navigate(`/chat/${admin.id}`)}
                      className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </button>
                    <button
                      onClick={() => navigate(`/users/${admin.id}`)}
                      className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Members List */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-purple-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Members</h3>
                    <p className="text-sm text-gray-400">{members.length} members</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/group-members/${groupId}`)}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  View All
                </button>
              </div>

              {members.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">No members yet</p>
                  <p className="text-gray-500 text-sm">
                    Invite people to join this group
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {members.map((m) => (
                    <div
                      key={m.user_id}
                      className="flex items-center justify-between p-4 bg-gray-900/30 rounded-xl hover:bg-gray-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="relative">
                          <img
                            src={m.profiles.avatar_url || "https://via.placeholder.com/40"}
                            className="w-12 h-12 rounded-full border-2 border-purple-500/30 object-cover"
                            alt={m.profiles.username}
                          />
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900 ${
                            m.profiles.is_online ? 'bg-green-500' : 'bg-gray-500'
                          }`} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-white truncate">
                            {m.profiles.username}
                            {m.user_id === currentUserId && (
                              <span className="ml-2 bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full text-xs font-medium">
                                You
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-gray-400">
                            Joined {new Date(m.profiles.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/chat/${m.profiles.id}`)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          title="Message"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/users/${m.profiles.id}`)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <User className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Show Invite button only for admin */}
              {isAdmin && (
                <div className="mt-8 pt-6 border-t border-gray-700">
                  <button
                    onClick={() => navigate(`/invite/${groupId}`)}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 text-purple-300 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Mail className="w-5 h-5" />
                    Invite More Members
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}