import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../services/supabase"
import { useAuth } from "../hooks/useAuth"
import Navbar from "../components/Navbar"
import {
  ArrowLeft,
  Send,
  UserPlus,
  Users,
  Trash2,
  MoreVertical,
  X,
  MessageCircle,
  Clock,
  User,
  Shield,
  LogOut,
  Eye,
  Settings,
  AlertCircle,
  CheckCircle
} from "lucide-react"

export default function GroupChat() {
  const { user } = useAuth()
  const { id: groupId } = useParams()
  const navigate = useNavigate()

  const [group, setGroup] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [members, setMembers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const [showAddMember, setShowAddMember] = useState(false)
  const [showRemoveMember, setShowRemoveMember] = useState(false)
  const [showAdminMenu, setShowAdminMenu] = useState(false)

  const messagesContainerRef = useRef(null)
  const inputRef = useRef(null)

  const isAdmin = group?.created_by === user.id

  // ---------------- Utils ----------------
  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      }
    }, 100)
  }

  // ---------------- Fetch group ----------------
  const fetchGroup = async () => {
    const { data } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single()
    setGroup(data)
  }

  // ---------------- Fetch members ----------------
  const fetchMembers = async () => {
    const { data } = await supabase
      .from("group_members")
      .select("user:profiles(id, username, avatar_url, is_online)")
      .eq("group_id", groupId)

    setMembers(data?.map((m) => m.user) || [])
  }

  // ---------------- Fetch all users ----------------
  const fetchAllUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id)
    setAllUsers(data || [])
  }

  // ---------------- Fetch messages ----------------
  const fetchMessages = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("group_messages")
      .select("*, sender:profiles(username, avatar_url)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })

    setMessages(data || [])
    setLoading(false)
    scrollToBottom()
  }

  // send message
  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
  
    const tempId = crypto.randomUUID()
  
    const tempMessage = {
      id: tempId,
      sender_id: user.id,
      group_id: groupId,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      sender: { 
        username: user.username,
        avatar_url: user.avatar_url 
      },
      optimistic: true
    }
  
    setMessages((prev) => [...prev, tempMessage])
    setNewMessage("")
    scrollToBottom()
  
    const { error } = await supabase
      .from("group_messages")
      .insert({
        group_id: groupId,
        sender_id: user.id,
        content: tempMessage.content
      })
  
    if (error) {
      console.error("Failed to send message:", error)
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    }
  }

  // ---------------- Delete message ----------------
  const deleteMessage = async (msg) => {
    if (!(msg.sender_id === user.id || isAdmin)) return

    await supabase.from("group_messages").delete().eq("id", msg.id)
    setMessages((p) => p.filter((m) => m.id !== msg.id))
  }

  // ---------------- Add member (ADMIN) ----------------
  const addMember = async (u) => {
    await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: u.id
    })
    fetchMembers()
    setShowAddMember(false)
  }

  // ---------------- Remove member (ADMIN) ----------------
  const removeMember = async (u) => {
    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", u.id)

    fetchMembers()
  }

  // ---------------- Leave group (MEMBER) ----------------
  const leaveGroup = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) return

    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id)

    navigate("/groups")
  }

  // ---------------- Delete group (ADMIN) ----------------
  const deleteGroup = async () => {
    if (!window.confirm("Delete this group permanently? This action cannot be undone.")) return

    await supabase.from("group_messages").delete().eq("group_id", groupId)
    await supabase.from("group_members").delete().eq("group_id", groupId)
    await supabase.from("groups").delete().eq("id", groupId)

    navigate("/groups")
  }

  // ---------------- Realtime ----------------
  useEffect(() => {
    if (!groupId || !user?.id) return
  
    const channel = supabase
      .channel(`group-chat:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages"
        },
        (payload) => {
          const msg = payload.new
  
          if (msg.group_id !== groupId) return
          if (msg.sender_id === user.id) return
  
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
  
          scrollToBottom()
        }
      )
      .subscribe()
  
    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, user?.id])
  

  // ---------------- Init ----------------
  useEffect(() => {
    fetchGroup()
    fetchMessages()
    fetchMembers()
    fetchAllUsers()
  }, [groupId])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading group chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          
          {/* LEFT */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => navigate("/groups")}
              className="p-1.5 sm:p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-white truncate max-w-[120px] sm:max-w-xs">
                {group.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {members.length + 1} members
                </span>

                <span className="text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {members.filter(m => m.is_online).length + 1} online
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => navigate(`/groups/${group.id}`)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="View Group"
            >
              <Eye className="w-5 h-5" />
            </button>

            {isAdmin ? (
              <div className="relative">
                <button
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title="Admin Actions"
                >
                  <Settings className="w-5 h-5" />
                </button>

                {showAdminMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 sm:w-48 bg-gray-800 rounded-xl border border-gray-700 shadow-2xl z-30">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowAddMember(true)
                          setShowAdminMenu(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span className="text-sm">Add Member</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowRemoveMember(true)
                          setShowAdminMenu(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Users className="w-4 h-4" />
                        <span className="text-sm">Manage Members</span>
                      </button>

                      <button
                        onClick={deleteGroup}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Delete Group</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={leaveGroup}
                className="p-1.5 sm:p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Leave Group"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{ minHeight: 0 }}
      >
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-gray-400">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No messages yet</p>
              <p className="text-gray-500 text-sm">
                Be the first to send a message in this group
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => {
                const time = new Date(m.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })

                const isOwnMessage = m.sender_id === user.id
                const canDelete = isOwnMessage || isAdmin

                return (
                  <div
                    key={m.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] lg:max-w-[60%] ${
                      isOwnMessage 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl rounded-tr-none' 
                        : 'bg-gray-800 text-gray-200 rounded-2xl rounded-tl-none'
                    } p-4 shadow-lg`}>
                      <div className="flex items-center gap-2 mb-2">
                        {!isOwnMessage && (
                          <img
                            src={m.sender?.avatar_url || "https://via.placeholder.com/32"}
                            className="w-6 h-6 rounded-full"
                            alt={m.sender?.username}
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            {!isOwnMessage && (
                              <span className="text-xs font-medium text-gray-300">
                                {m.sender?.username || "Unknown"}
                              </span>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-xs opacity-80">
                                {time}
                              </span>
                              {canDelete && (
                                <button
                                  onClick={() => deleteMessage(m)}
                                  className="text-xs opacity-60 hover:opacity-100 transition-opacity p-1"
                                  title="Delete message"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-white/90">{m.content}</p>
                      {m.optimistic && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-white/50">
                          <Clock className="w-3 h-3" />
                          Sending...
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* INPUT FORM */}
      <div className="sticky bottom-0 bg-gray-900/80 backdrop-blur-md border-t border-gray-800 px-3 sm:px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <form onSubmit={handleSend} className="flex items-end gap-2 sm:gap-3">
            {/* Group Info Button */}
            <button
              type="button"
              onClick={() => navigate(`/groups/${groupId}`)}
              className="flex-shrink-0 p-2.5 sm:p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
              title="Group Info"
            >
              <Users className="w-5 sm:w-6 h-5 sm:h-6 text-gray-300" />
            </button>

            {/* Message Input */}
            <input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className={`flex-shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                !newMessage.trim()
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-purple-500/25'
              }`}
            >
              <Send className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <Modal
          title="Add Member"
          icon={<UserPlus className="w-6 h-6 text-purple-400" />}
          close={() => setShowAddMember(false)}
        >
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allUsers.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No users available to add</p>
            ) : (
              allUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => addMember(u)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-purple-600/20 rounded-xl transition-colors group"
                >
                  <img
                    src={u.avatar_url || "https://via.placeholder.com/40"}
                    className="w-10 h-10 rounded-full"
                    alt={u.username}
                  />
                  <div className="text-left flex-1">
                    <p className="font-medium text-gray-200 group-hover:text-white">
                      {u.username}
                    </p>
                    <p className="text-xs text-gray-400">
                      {u.is_online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-500/20 group-hover:bg-purple-500/30 rounded-lg">
                    <UserPlus className="w-4 h-4 text-purple-300" />
                  </div>
                </button>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* Remove Member Modal */}
      {showRemoveMember && (
        <Modal
          title="Remove Member"
          icon={<Users className="w-6 h-6 text-red-400" />}
          close={() => setShowRemoveMember(false)}
        >
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {members.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No members to remove</p>
            ) : (
              members.map((u) => (
                <button
                  key={u.id}
                  onClick={() => removeMember(u)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-red-600/20 rounded-xl transition-colors group"
                >
                  <div className="relative">
                    <img
                      src={u.avatar_url || "https://via.placeholder.com/40"}
                      className="w-10 h-10 rounded-full"
                      alt={u.username}
                    />
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900 ${
                      u.is_online ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium text-gray-200 group-hover:text-white">
                      {u.username}
                    </p>
                    <p className="text-xs text-gray-400">
                      {u.is_online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                  <div className="p-2 bg-red-500/20 group-hover:bg-red-500/30 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-300" />
                  </div>
                </button>
              ))
            )}
          </div>
        </Modal>
      )}

     
    </div>
  )
}

/* -------- Modal Component -------- */
function Modal({ title, icon, close, children }) {
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={close}
    >
      <div 
        className="bg-gray-800/90 backdrop-blur-md rounded-2xl border border-gray-700 w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon}
              <h2 className="text-xl font-semibold text-white">{title}</h2>
            </div>
            <button
              onClick={close}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
        
        <div className="p-6 border-t border-gray-700">
          <button
            onClick={close}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}