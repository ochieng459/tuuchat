import { useState, useEffect } from "react"
import { supabase } from "../services/supabase"
import { useAuth } from "../hooks/useAuth"
import { useNavigate } from "react-router-dom"

import { 
  User, 
  Camera, 
  Edit2, 
  Save, 
  X, 
  LogOut, 
  ArrowLeft, 
  Users,
  Image as ImageIcon,
  Mail,
  Calendar,
  Globe
} from "lucide-react"

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [newName, setNewName] = useState("")
  const [uploading, setUploading] = useState(false)

  const [groups, setGroups] = useState([])
  const [editingGroupId, setEditingGroupId] = useState(null)
  const [groupName, setGroupName] = useState("")
  const [editingBioGroupId, setEditingBioGroupId] = useState(null)
  const [groupBio, setGroupBio] = useState("")

  /* =========================
     FETCH PROFILE
  ========================== */
  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!error) {
      setProfile(data)
      setNewName(data.username)
    }
  }

  /* =========================
     FETCH USER GROUPS
  ========================== */
  const fetchMyGroups = async () => {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("created_by", user.id)

    if (!error) setGroups(data)
  }

  useEffect(() => {
    fetchProfile()
    fetchMyGroups()
  }, [user.id])

  /* =========================
     UPDATE USER AVATAR
  ========================== */
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)

    const fileName = `users/${user.id}-${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      console.error(uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName)

    await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", user.id)

    setProfile((prev) => ({ ...prev, avatar_url: urlData.publicUrl }))
    setUploading(false)
  }

  /* =========================
     UPDATE USERNAME
  ========================== */
  const handleNameChange = async () => {
    if (!newName.trim()) return

    await supabase
      .from("profiles")
      .update({ username: newName.trim() })
      .eq("id", user.id)

    setProfile((prev) => ({ ...prev, username: newName.trim() }))
  }

  /* =========================
     RENAME GROUP
  ========================== */
  const handleRenameGroup = async (groupId) => {
    if (!groupName.trim()) return

    await supabase
      .from("groups")
      .update({ name: groupName.trim() })
      .eq("id", groupId)

    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, name: groupName.trim() } : g
      )
    )

    setEditingGroupId(null)
    setGroupName("")
  }

  /* =========================
     UPDATE GROUP BIO
  ========================== */
  const handleUpdateGroupBio = async (groupId) => {
    await supabase
      .from("groups")
      .update({ bio: groupBio.trim() })
      .eq("id", groupId)

    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, bio: groupBio.trim() } : g
      )
    )

    setEditingBioGroupId(null)
    setGroupBio("")
  }

  /* =========================
     UPDATE GROUP AVATAR
  ========================== */
  const handleGroupAvatarChange = async (e, groupId) => {
    const file = e.target.files[0]
    if (!file) return

    const fileName = `groups/${groupId}-${Date.now()}-${file.name}`

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true })

    if (error) {
      console.error(error.message)
      return
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName)

    await supabase
      .from("groups")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", groupId)

    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, avatar_url: urlData.publicUrl } : g
      )
    )
  }

  if (!profile) {
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            My Profile
          </h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* User Profile Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar Section */}
            <div className="relative group">
              <div className="relative w-32 h-32">
                <img
                  src={profile.avatar_url || "https://via.placeholder.com/128"}
                  className="w-full h-full rounded-full border-4 border-purple-500/30 object-cover"
                  alt="avatar"
                />
                <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                </label>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                Click to change photo
              </p>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  {editingGroupId === "user" ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter new name"
                      />
                      <button
                        onClick={() => {
                          handleNameChange()
                          setEditingGroupId(null)
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingGroupId(null)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-white">{profile.username}</h2>
                      <button
                        onClick={() => {
                          setEditingGroupId("user")
                          setNewName(profile.username)
                        }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* User Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Mail className="w-4 h-4" />
                      <span className="text-xs">Email</span>
                    </div>
                    <p className="text-sm text-gray-300 truncate">{user.email}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs">Groups</span>
                    </div>
                    <p className="text-sm text-gray-300">{groups.length}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">Member Since</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Globe className="w-4 h-4" />
                      <span className="text-xs">Status</span>
                    </div>
                    <p className="text-sm text-green-400">Online</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My Groups Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-400" />
              My Groups (Admin)
            </h3>
            <button
              onClick={() => navigate("/groups")}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Create Group
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="bg-gray-800/30 rounded-2xl p-12 text-center border border-dashed border-gray-700">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No groups yet</p>
              <p className="text-gray-500 text-sm mb-6">Create your first group to start chatting with multiple people</p>
              <button
                onClick={() => navigate("/groups")}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all"
              >
                Create Your First Group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-5 border border-gray-700 hover:border-purple-500/30 transition-all group"
                >
                  {/* Group Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <img
                        src={group.avatar_url || "https://via.placeholder.com/48"}
                        className="w-12 h-12 rounded-full border-2 border-purple-500/30 object-cover"
                        alt="group avatar"
                      />
                      <label className="absolute -bottom-1 -right-1 bg-gray-800 p-1 rounded-full cursor-pointer hover:bg-gray-700 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleGroupAvatarChange(e, group.id)}
                        />
                        <ImageIcon className="w-3 h-3 text-gray-300" />
                      </label>
                    </div>

                    <div className="flex-1">
                      {editingGroupId === group.id ? (
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            placeholder="Group name"
                          />
                          <button
                            onClick={() => handleRenameGroup(group.id)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            Save
                          </button>
                          <button
                            onClick={() => setEditingGroupId(null)}
                            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-medium text-white">{group.name}</h4>
                          <button
                            onClick={() => {
                              setEditingGroupId(group.id)
                              setGroupName(group.name)
                            }}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Group Bio */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Group Bio</span>
                      {editingBioGroupId === group.id ? (
                        <button
                          onClick={() => handleUpdateGroupBio(group.id)}
                          className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Save Bio
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingBioGroupId(group.id)
                            setGroupBio(group.bio || "")
                          }}
                          className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit Bio
                        </button>
                      )}
                    </div>

                    {editingBioGroupId === group.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={groupBio}
                          onChange={(e) => setGroupBio(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          rows="3"
                          placeholder="Enter group bio..."
                        />
                      </div>
                    ) : (
                      <p className="text-gray-300 text-sm p-3 bg-gray-900/30 rounded-lg">
                        {group.bio || "No bio set for this group."}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
          <div className="space-y-4">
            <button
              onClick={logout}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-3"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              
              <button
                onClick={() => navigate("/help")}
                className="py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl font-medium transition-colors"
              >
                Help & Support
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}