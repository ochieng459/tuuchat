import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../services/supabase"
import { useAuth } from "../hooks/useAuth"
import avatarPlaceholder from "../assets/avatar-placeholder.png";
import {
  ArrowLeft,
  Users,
  Shield,
  ShieldOff,
  MessageCircle,
  Calendar,
  Globe,
  Lock,
  UserCheck,
  UserX,
  Mail,
  Clock,
  Eye
} from "lucide-react"

export default function UserProfile() {
  const { id } = useParams() // viewed user id
  const { user } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [groups, setGroups] = useState([])
  const [isBlocked, setIsBlocked] = useState(false)
  const [loading, setLoading] = useState(true)

  /* ---------------- FETCH PROFILE ---------------- */
  useEffect(() => {
    if (!id) return

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error(error.message)
        return
      }

      setProfile(data)
    }

    fetchProfile()
  }, [id])

  /* ---------------- FETCH GROUPS USER IS IN ---------------- */
  useEffect(() => {
    if (!id) return

    const fetchUserGroups = async () => {
      try {
        const { data: memberData, error: memberError } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", id)

        if (memberError) {
          console.error("Error fetching group memberships:", memberError.message)
          return
        }

        if (!memberData || memberData.length === 0) {
          setGroups([])
          return
        }

        const groupIds = memberData.map(member => member.group_id)

        const { data: groupsData, error: groupsError } = await supabase
          .from("groups")
          .select("*")
          .in("id", groupIds)

        if (groupsError) {
          console.error("Error fetching groups:", groupsError.message)
          return
        }

        setGroups(groupsData || [])
      } catch (error) {
        console.error("Error in fetchUserGroups:", error)
      }
    }

    fetchUserGroups()
  }, [id])

  /* ---------------- BLOCK STATUS ---------------- */
  useEffect(() => {
    if (!user?.id || !id) return

    const checkBlock = async () => {
      const { data } = await supabase
        .from("blocked_users")
        .select("id")
        .eq("blocker_id", user.id)
        .eq("blocked_id", id)
        .single()

      setIsBlocked(!!data)
      setLoading(false)
    }

    checkBlock()
  }, [user, id])

  /* ---------------- BLOCK / UNBLOCK ---------------- */
  const toggleBlock = async () => {
    if (isBlocked) {
      await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", id)
      setIsBlocked(false)
    } else {
      await supabase.from("blocked_users").insert({
        blocker_id: user.id,
        blocked_id: id
      })
      setIsBlocked(true)
    }
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            User Profile
          </h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar Section */}
            <div className="relative">
              <img
                src={profile.avatar_url || avatarPlaceholder}
                className="w-32 h-32 rounded-full border-4 border-purple-500/30 object-cover"
                alt={profile.username}
              />
              <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-gray-900 ${
                profile.is_online ? 'bg-green-500' : 'bg-gray-500'
              }`} />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">{profile.username}</h2>
                  <div className="flex items-center gap-2 text-gray-400">
                    {profile.is_online ? (
                      <span className="flex items-center gap-1 text-green-400">
                        <UserCheck className="w-4 h-4" />
                        Online
                      </span>
                    ) : profile.last_seen ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Last seen {new Date(profile.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-500">
                        <UserX className="w-4 h-4" />
                        Offline
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/chat/${id}`)}
                  className="mt-4 md:mt-0 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Send Message
                </button>
              </div>

              {/* User Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Users className="w-4 h-4" />
                    <span className="text-xs">Groups</span>
                  </div>
                  <p className="text-lg font-semibold text-white">{groups.length}</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">Member Since</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs">Status</span>
                  </div>
                  <p className={`text-sm ${profile.is_online ? 'text-green-400' : 'text-gray-400'}`}>
                    {profile.is_online ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-xs">Contact</span>
                  </div>
                  <button className="text-sm text-purple-400 hover:text-purple-300">
                    Send Email
                  </button>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="bg-gray-900/30 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Bio</h3>
                  <p className="text-gray-300">{profile.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={toggleBlock}
                className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  isBlocked 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                    : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'
                }`}
              >
                {isBlocked ? (
                  <>
                    <ShieldOff className="w-5 h-5" />
                    Unblock User
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Block User
                  </>
                )}
              </button>
              
              
            </div>
          </div>
        </div>

        {/* Groups Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-400" />
              Groups ({groups.length})
            </h3>
          </div>

          {groups.length === 0 ? (
            <div className="bg-gray-800/30 rounded-2xl p-12 text-center border border-dashed border-gray-700">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No groups yet</p>
              <p className="text-gray-500 text-sm">This user is not a member of any groups</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-5 border border-gray-700 hover:border-purple-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={group.avatar_url || "https://via.placeholder.com/48"}
                      className="w-12 h-12 rounded-full border-2 border-purple-500/30 object-cover"
                      alt={group.name}
                    />
                    <div>
                      <h4 className="font-medium text-white">{group.name}</h4>
                      <p className="text-xs text-gray-400">Group • {group.member_count || 0} members</p>
                    </div>
                  </div>
                  {group.bio && (
                    <p className="text-sm text-gray-300 line-clamp-2">{group.bio}</p>
                  )}
                  <button
                    onClick={() => navigate(`/group/${group.id}`)}
                    className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Group
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Private Rooms & Groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Private Rooms */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Lock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Private Rooms</h3>
                <p className="text-sm text-gray-400">Secure one-on-one conversations</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Private rooms with this user will appear here when created. These rooms provide enhanced privacy and security for sensitive conversations.
            </p>
            
          </div>

          {/* Private Groups */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-pink-500/20 rounded-lg">
                <Users className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Private Groups</h3>
                <p className="text-sm text-gray-400">Invite-only group chats</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Private groups that include this user will be listed here. These groups are invite-only and offer more control over membership and content.
            </p>
            
          </div>
        </div>
      </main>
    </div>
  )
}