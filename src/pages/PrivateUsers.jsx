import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"
import { useAuth } from "../hooks/useAuth"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import {
  UserPlus,
  X,
  Lock,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  MessageCircle
} from "lucide-react"

export default function PrivateUsers() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [privateUsers, setPrivateUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [addingUser, setAddingUser] = useState(null)

  // --- Fetch private users ---
  const fetchPrivateUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("private_chats")
      .select("target_user:profiles!private_chats_target_user_id_fkey(*)")
      .eq("owner_id", user.id)

    if (error) {
      console.error("Error fetching private users:", error)
      setLoading(false)
      return
    }

    setPrivateUsers(data.map((item) => item.target_user))
    setLoading(false)
  }

  // --- Fetch all users (for adding to private) ---
  const fetchAllUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id) // exclude self

    if (error) return console.error("Error fetching users:", error)

    setAllUsers(data)
  }

  // --- Add user to private ---
  const handleAddPrivateUser = async (selectedUser) => {
    setAddingUser(selectedUser.id)
    const { error } = await supabase.from("private_chats").upsert({
      owner_id: user.id,
      target_user_id: selectedUser.id
    })

    if (error) {
      console.error("Failed to add private user:", error)
      alert("Failed to add user")
      setAddingUser(null)
      return
    }

    fetchPrivateUsers()
    setAddingUser(null)
    setShowAddModal(false)
  }

  // --- Remove private user ---
  const handleRemove = async (id) => {
    const { error } = await supabase
      .from("private_chats")
      .delete()
      .eq("owner_id", user.id)
      .eq("target_user_id", id)

    if (error) return console.error("Failed to remove private user:", error)
    fetchPrivateUsers()
  }

  // Filter users based on search
  const filteredUsers = allUsers.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // --- Initial fetch ---
  useEffect(() => {
    fetchPrivateUsers()
    fetchAllUsers()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-xl font-bold text-white">Private Users</h1>
              <p className="text-xs text-gray-400">Secure one-on-one conversations</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Add User
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full pb-24"> {/* Added pb-24 for footer space */}
        {/* Private Users Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-400" />
                Your Private Users ({privateUsers.length})
              </h2>
              <p className="text-sm text-gray-400">
                Users you've added for private conversations
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add More
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
              <p className="text-gray-400">Loading private users...</p>
            </div>
          ) : privateUsers.length === 0 ? (
            <div className="text-center py-12">
              <Lock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No private users yet</p>
              <p className="text-gray-500 text-sm mb-6">
                Add users to start private conversations with enhanced security
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 mx-auto"
              >
                <UserPlus className="w-5 h-5" />
                Add Your First Private User
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {privateUsers.map((u) => (
                <div
                  key={u.id}
                  className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-5 border border-gray-700 hover:border-purple-500/30 transition-all group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <img
                        src={u.avatar_url || "https://via.placeholder.com/48"}
                        className="w-14 h-14 rounded-full border-2 border-purple-500/30 object-cover"
                        alt={u.username}
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${
                        u.is_online ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{u.username}</h4>
                      <p className="text-xs text-gray-400">
                        {u.is_online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/chat/${u.id}`)}
                      className="flex-1 px-3 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Private Chat
                    </button>
                    <button
                      onClick={() => handleRemove(u.id)}
                      className="px-3 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-sm font-medium transition-colors"
                      title="Remove from private"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Sticky Footer with Navbar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md border-t border-gray-800 z-20">
        <Navbar />
      </footer>

      {/* Add User Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-gray-800/90 backdrop-blur-md rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-6 h-6 text-purple-400" />
                  <h2 className="text-xl font-semibold text-white">Add Private User</h2>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  {filteredUsers.length} users found
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Filter className="w-3 h-3" />
                  Showing all users
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">No users found</p>
                  <p className="text-gray-500 text-sm">
                    {searchTerm ? "Try a different search term" : "No users available to add"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((u) => {
                    const isAlreadyPrivate = privateUsers.some(pu => pu.id === u.id)
                    const isAdding = addingUser === u.id
                    
                    return (
                      <div
                        key={u.id}
                        className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer ${
                          isAlreadyPrivate 
                            ? 'bg-green-500/10 border border-green-500/20' 
                            : 'bg-gray-900/30 hover:bg-gray-900/50 border border-gray-700 hover:border-purple-500/30'
                        }`}
                        onClick={() => !isAlreadyPrivate && handleAddPrivateUser(u)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={u.avatar_url || "https://via.placeholder.com/40"}
                              alt={u.username}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900 ${
                              u.is_online ? 'bg-green-500' : 'bg-gray-500'
                            }`} />
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{u.username}</h4>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-gray-400">
                                {u.is_online ? 'Online' : 'Offline'}
                              </p>
                              {isAlreadyPrivate && (
                                <span className="flex items-center gap-1 text-xs text-green-400">
                                  <CheckCircle className="w-3 h-3" />
                                  Already private
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          {isAlreadyPrivate ? (
                            <button className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg text-sm font-medium flex items-center gap-2" disabled>
                              <CheckCircle className="w-4 h-4" />
                              Added
                            </button>
                          ) : isAdding ? (
                            <button className="px-4 py-2 bg-purple-600/30 text-purple-300 rounded-lg text-sm font-medium flex items-center gap-2" disabled>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Adding...
                            </button>
                          ) : (
                            <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                              <UserPlus className="w-4 h-4" />
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-700">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-white mb-1">Privacy Notice</h4>
                    <p className="text-xs text-gray-400">
                      Users added here will have access to private conversations with enhanced security features.
                      They can be removed at any time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}