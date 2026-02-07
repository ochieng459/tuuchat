import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "../services/supabase"
import { useAuth } from "../hooks/useAuth"
import { useParams, useNavigate } from "react-router-dom"
import avatarPlaceholder from "../assets/avatar-placeholder.png"

export default function Chat() {
  const { user } = useAuth()
  const { id: receiverId } = useParams()
  const navigate = useNavigate()

  const senderId = user?.id
  const receiverUUID = receiverId

  const [receiver, setReceiver] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [showGroupSelector, setShowGroupSelector] = useState(false)
  const [userGroups, setUserGroups] = useState([])
  const [previewImage, setPreviewImage] = useState(null)
  const [usersOnline, setUsersOnline] = useState([])
  
  // New states for image preview before sending
  const [imageToSend, setImageToSend] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // scroll helper
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    })
  }

  /* ---------------- PRESENCE (ONLINE / LAST SEEN) ---------------- */
  useEffect(() => {
    if (!user?.id) return

    supabase
      .from("profiles")
      .update({ is_online: true })
      .eq("id", user.id)

    const handleOffline = async () => {
      await supabase
        .from("profiles")
        .update({
          is_online: false,
          last_seen: new Date().toISOString()
        })
        .eq("id", user.id)
    }

    window.addEventListener("beforeunload", handleOffline)

    return () => {
      handleOffline()
      window.removeEventListener("beforeunload", handleOffline)
    }
  }, [user])

  useEffect(() => {
    console.log("🟢 Users online:", usersOnline)
  }, [usersOnline])

  // --- Fetch receiver info ---
  const fetchReceiver = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", receiverId)
      .single()
    setReceiver(data)
  }

  // --- Mark messages as read ---
  const markAsRead = useCallback(async () => {
    if (!senderId || !receiverUUID) return

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("sender_id", receiverUUID)
      .eq("receiver_id", senderId)
      .eq("is_read", false)
  }, [senderId, receiverUUID])

  // --- Fetch last 50 messages ---
  const fetchMessages = async () => {
    setLoading(true)
  
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: false })
      .limit(50)
  
    if (error) {
      console.error(error)
      setLoading(false)
      return
    }
  
    const orderedMessages = (data || []).reverse()
    setMessages(orderedMessages)
    setLoading(false)
    scrollToBottom()
  
    if (orderedMessages.length) {
      markAsRead()
    }
  }

  // --- Realtime subscription ---
  useEffect(() => {
    if (!user?.id || !receiverId) return

    fetchReceiver()
    fetchMessages()

    const channel = supabase
      .channel(`chat:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages"
        },
        (payload) => {
          const msg = payload.new
          if (msg.sender_id === user.id) return

          const isOurChat =
            msg.sender_id === receiverId && msg.receiver_id === user.id

          if (!isOurChat) return

          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })

          scrollToBottom()
          markAsRead()
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id, receiverId])

  // online presence
  useEffect(() => {
    if (!user?.id) return
  
    const room = supabase.channel("online-users", {
      config: {
        presence: {
          key: user.id
        }
      }
    })
  
    room
      .on("presence", { event: "sync" }, () => {
        const state = room.presenceState()
        const onlineUsers = Object.values(state).flat()
        setUsersOnline(onlineUsers)
      })
  
    room.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await room.track({
          user_id: user.id,
          username: user.username
        })
      }
    })
  
    return () => {
      supabase.removeChannel(room)
    }
  }, [user?.id])

  // --- Send message ---
  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const tempMessage = {
      id: crypto.randomUUID(),
      sender_id: user.id,
      receiver_id: receiverId,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      is_read: false
    }

    setMessages((prev) => [...prev, tempMessage])
    scrollToBottom()
    setNewMessage("")

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: tempMessage.content
    })

    if (error) console.error("Failed to send message:", error)
  }

  /* ---------------- IMAGE PREVIEW BEFORE SENDING ---------------- */
  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Only images allowed")
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setImagePreviewUrl(previewUrl)
    setImageToSend(file)
  }

  const cancelImageSend = () => {
    setImagePreviewUrl(null)
    setImageToSend(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  /* ---------------- SEND IMAGE ---------------- */
  const sendImage = async () => {
    if (!imageToSend) return

    setUploadingImage(true)

    try {
      const path = `photos/${crypto.randomUUID()}-${imageToSend.name}`

      const { error: uploadError } = await supabase.storage
        .from("massage-media")
        .upload(path, imageToSend)

      if (uploadError) {
        console.error("Upload error:", uploadError.message)
        alert("Failed to upload image")
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from("massage-media")
        .getPublicUrl(path)

      const tempMessage = {
        id: crypto.randomUUID(),
        sender_id: senderId,
        receiver_id: receiverId,
        content: "",
        media_path: path,
        media_type: "image",
        view_once: true,
        is_read: false,
        created_at: new Date().toISOString(),
        public_url: publicUrlData.publicUrl
      }

      setMessages((prev) => [...prev, tempMessage])
      scrollToBottom()

      const { error: insertError } = await supabase.from("messages").insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content: "",
        media_path: path,
        media_type: "image",
        view_once: true,
        is_read: false
      })

      if (insertError) {
        console.error("Insert error:", insertError.message)
        setMessages((prev) => prev.filter(m => m.id !== tempMessage.id))
        alert("Failed to send image")
      }

    } catch (error) {
      console.error("Error sending image:", error)
      alert("Error sending image")
    } finally {
      setUploadingImage(false)
      cancelImageSend()
    }
  }

  /* ---------------- OPEN VIEW-ONCE PHOTO ---------------- */
  const openViewOnceImage = async (msg) => {
    const { data } = supabase.storage
      .from("massage-media")
      .getPublicUrl(msg.media_path)

    setPreviewImage({
      ...msg,
      url: data.publicUrl
    })

    await supabase.from("messages").delete().eq("id", msg.id)
    setMessages((p) => p.filter((m) => m.id !== msg.id))
  }

  /* ---------------- DELETE MESSAGE ---------------- */
  const deleteMessage = async (messageId) => {
    const messageToDelete = messages.find(m => m.id === messageId)
    
    if (messageToDelete?.media_path) {
      await supabase.storage
        .from("massage-media")
        .remove([messageToDelete.media_path])
    }

    const { data, error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId)
      .select()

    if (error) {
      console.error("Delete error:", error.message)
      return
    }

    setMessages((prev) => prev.filter((m) => m.id !== messageId))
  }

  const addToGroup = async () => {
    setShowGroupSelector(true)
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("created_by", user.id)

    if (error) return alert("Failed to fetch groups")
    setUserGroups(data || [])
  }

  const handleGroupSelect = async (groupId) => {
    const { error } = await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: receiverId
    })

    if (error) return alert("Failed to add user to group")
    alert("User added to group")
    setShowGroupSelector(false)
  }

  const blockUser = async () => {
    const confirmBlock = window.confirm("Are you sure you want to block this user?")
    if (!confirmBlock) return

    const { error } = await supabase.from("blocked_users").insert({
      blocker_id: user.id,
      blocked_id: receiverId
    })

    if (error) return alert("Failed to block user or already blocked")
    navigate("/home")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col">
      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewImage.url}
              alt="view once"
              className="rounded-xl max-w-full max-h-[80vh] object-contain shadow-2xl"
            />
            <button
              className="absolute -top-3 -right-3 bg-gray-800 hover:bg-gray-700 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-colors"
              onClick={() => setPreviewImage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* IMAGE PREVIEW BEFORE SENDING */}
      {imagePreviewUrl && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-gray-800/90 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-gray-700 shadow-2xl">
            <h3 className="text-white text-xl font-semibold mb-4">Preview Photo</h3>
            
            <div className="mb-6 flex justify-center">
              <img
                src={imagePreviewUrl}
                alt="Preview"
                className="max-h-72 rounded-xl object-contain shadow-lg"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={cancelImageSend}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200"
                disabled={uploadingImage}
              >
                Cancel
              </button>
              <button
                onClick={sendImage}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <>
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    Sending...
                  </>
                ) : (
                  "Send Photo"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
<header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-3 py-3">
  <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">

    {/* LEFT SIDE */}
    <div className="flex items-center gap-3 flex-shrink-0 min-w-0">

      {/* Back */}
      <button
        onClick={() => navigate("/home")}
        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Avatar + Name */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex-shrink-0">
          <img
            src={receiver?.avatar_url || avatarPlaceholder}
            alt={receiver?.username}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-purple-500/30"
          />
          <div
            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-gray-900 ${
              receiver?.is_online ? "bg-green-500" : "bg-gray-500"
            }`}
          />
        </div>

        <div className="min-w-0">
          <h2 className="text-sm sm:text-lg font-semibold text-white truncate">
            {receiver?.username}
          </h2>

          <p className="text-xs text-gray-400 truncate">
            {receiver?.is_online ? (
              <span className="text-green-400">● Online</span>
            ) : receiver?.last_seen ? (
              `Last seen ${new Date(receiver.last_seen).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })}`
            ) : (
              "Offline"
            )}
          </p>
        </div>
      </div>
    </div>

    {/* RIGHT SIDE ACTIONS */}
    <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:ml-auto">

      <button
        onClick={() => navigate(`/users/${receiverId}`)}
        className="flex-1 sm:flex-none px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs sm:text-sm font-medium transition"
      >
        Profile
      </button>

      <button
        onClick={addToGroup}
        className="flex-1 sm:flex-none px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg text-xs sm:text-sm font-medium transition"
      >
        Add
      </button>

      <button
        onClick={blockUser}
        className="flex-1 sm:flex-none px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-xs sm:text-sm font-medium transition"
      >
        Block
      </button>

    </div>

  </div>
</header>


      {/* GROUP SELECTOR */}
      {showGroupSelector && (
        <div className="bg-gray-800/50 backdrop-blur-sm border-y border-gray-700 p-4">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-gray-200 font-medium mb-3">Select a group to add this user:</h3>
            <div className="flex flex-wrap gap-2">
              {userGroups.length === 0 ? (
                <p className="text-gray-400">You have no groups. Create one first.</p>
              ) : (
                userGroups.map((g) => (
                  <button
                    key={g.id}
                    className="px-4 py-2 bg-gray-700 hover:bg-purple-600 text-gray-200 hover:text-white rounded-lg transition-colors"
                    onClick={() => handleGroupSelect(g.id)}
                  >
                    {g.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-3">
          {messages.map((msg) => {
            const time = new Date(msg.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            })

            const isSent = msg.sender_id === senderId

            return (
              <div
                key={msg.id}
                className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] lg:max-w-[60%] ${
                  isSent 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl rounded-tr-none' 
                    : 'bg-gray-800 text-gray-200 rounded-2xl rounded-tl-none'
                } p-4 shadow-lg`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs opacity-80">
                      {time}
                    </span>
                    {isSent && !msg.view_once && (
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="text-xs opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {msg.media_type === "image" ? (
                    <div>
                      {msg.view_once ? (
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 hover:bg-gray-900/70 rounded-lg transition-colors"
                          onClick={() => openViewOnceImage(msg)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          View photo (once)
                        </button>
                      ) : (
                        <img
                          src={msg.public_url || supabase.storage.from("massage-media").getPublicUrl(msg.media_path).publicUrl}
                          alt="Sent"
                          className="max-w-full rounded-lg mt-1 shadow-inner"
                          loading="lazy"
                        />
                      )}
                    </div>
                  ) : (
                    <p className="text-white/90">{msg.content}</p>
                  )}
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT FORM */}
<div className="sticky bottom-0 bg-gray-900/80 backdrop-blur-md border-t border-gray-800 px-3 py-3">
  <div className="max-w-6xl mx-auto">
    <form onSubmit={handleSend} className="flex items-end gap-2">

      {/* Image Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current.click()}
        disabled={uploadingImage}
        className={`flex-shrink-0 p-2.5 sm:p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition ${
          uploadingImage ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {uploadingImage ? (
          <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )}
      </button>

      <input
        type="file"
        accept="image/*"
        hidden
        ref={fileInputRef}
        onChange={handleImageSelect}
        disabled={uploadingImage}
      />

      {/* Text Input */}
      <input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type your message..."
        disabled={uploadingImage}
        className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
      />

      {/* Send Button */}
      <button
        type="submit"
        disabled={uploadingImage || !newMessage.trim()}
        className={`flex-shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition ${
          uploadingImage || !newMessage.trim()
            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        }`}
      >
        Send
      </button>

    </form>
  </div>
</div>

    </div>
  )
}
