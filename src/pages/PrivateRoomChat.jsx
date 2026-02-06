import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { ArrowLeft, Eye, Send, Lock, User, ImageIcon, Loader2, Clock, X, VideoIcon, Check, CheckCheck, Trash2 } from "lucide-react";

export default function PrivateRoomChat() {
  const { id } = useParams(); // room ID
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  // Media states
  const [previewImage, setPreviewImage] = useState(null);
  const [imageToSend, setImageToSend] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Track optimistic messages to avoid duplicates
  const [optimisticIds, setOptimisticIds] = useState(new Set());

  // ---------------- Scroll to bottom ----------------
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ---------------- Fetch current user ----------------
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("User not authenticated", error);
        navigate("/home");
        return;
      }
      setUserId(user.id);
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();
      
      setUserProfile(profile);
    };

    fetchUser();
  }, [navigate]);

  // ---------------- Fetch room info & access ----------------
  const fetchRoom = async () => {
    setLoading(true);

    try {
      // 1️⃣ Get room info
      const { data: roomData, error: roomError } = await supabase
        .from("private_rooms")
        .select("id, name, description, image_url, created_by, price")
        .eq("id", id)
        .single();

      if (roomError || !roomData) throw roomError || new Error("Room not found");

      // 2️⃣ Allow access if user is creator
      if (roomData.created_by === userId) {
        setRoom(roomData);
        setLoading(false);
        return;
      }

      // 3️⃣ Otherwise, check room_access table
      const { data: accessData, error: accessError } = await supabase
        .from("room_access")
        .select("user_id")
        .eq("room_id", id)
        .eq("user_id", userId);

      if (accessError) throw accessError;

      if (!accessData || accessData.length === 0) {
        console.error("No access to room");
        navigate("/home");
        return;
      }

      setRoom(roomData);
    } catch (err) {
      console.error("Error fetching room/access:", err);
      navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Fetch messages ----------------
  const fetchMessages = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("private_room_messages")
      .select(`
        id, 
        user_id, 
        content, 
        media_path, 
        media_type, 
        view_once, 
        created_at,
        is_read,
        profiles:user_id (username, avatar_url)
      `)
      .eq("room_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Fetch messages error", error);
    } else {
      // Add public URLs for media
      const messagesWithUrls = data.map(msg => {
        if (msg.media_path) {
          const { data: urlData } = supabase.storage
            .from("massage-media")
            .getPublicUrl(msg.media_path);
          return {
            ...msg,
            public_url: urlData.publicUrl
          };
        }
        return msg;
      });
      setMessages(messagesWithUrls || []);
      scrollToBottom();
    }
  };

  // ---------------- Send message (FIXED Optimistic UI) ----------------
  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    setSending(true);

    // Generate a temporary ID for optimistic update
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Optimistic update
    const tempMessage = {
      id: tempId,
      room_id: id,
      user_id: userId,
      content: newMessage.trim(),
      media_path: null,
      media_type: null,
      view_once: false,
      created_at: new Date().toISOString(),
      is_read: false,
      profiles: userProfile,
      is_sending: true // Flag to show clock/tick
    };

    setMessages((prev) => [...prev, tempMessage]);
    setOptimisticIds(prev => new Set([...prev, tempId]));
    setNewMessage("");
    scrollToBottom();

    // Actual send to database
    const { data, error } = await supabase
      .from("private_room_messages")
      .insert([{ 
        room_id: id, 
        user_id: userId, 
        content: newMessage.trim()
      }])
      .select(`
        id, 
        user_id, 
        content, 
        media_path, 
        media_type, 
        view_once, 
        created_at,
        is_read,
        profiles:user_id (username, avatar_url)
      `)
      .single();

    setSending(false);

    if (error) {
      console.error("Send message error", error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setOptimisticIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
    } else {
      // Replace optimistic message with real one
      setMessages(prev => {
        const newMessages = prev.filter(msg => msg.id !== tempId);
        // Add public URL if needed
        const messageWithUrl = data.media_path ? {
          ...data,
          public_url: supabase.storage.from("massage-media").getPublicUrl(data.media_path).data.publicUrl
        } : data;
        return [...newMessages, messageWithUrl];
      });
      
      setOptimisticIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
      scrollToBottom();
    }
  };

  /* ---------------- DELETE MESSAGE ---------------- */
  const deleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    const messageToDelete = messages.find(m => m.id === messageId);
    
    // Delete media from storage if exists
    if (messageToDelete?.media_path) {
      try {
        await supabase.storage
          .from("massage-media")
          .remove([messageToDelete.media_path]);
      } catch (error) {
        console.error("Error deleting media:", error);
      }
    }

    // Delete message from database
    const { error } = await supabase
      .from("private_room_messages")
      .delete()
      .eq("id", messageId);

    if (error) {
      console.error("Delete message error:", error);
      alert("Failed to delete message");
      return;
    }

    // Remove from local state
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  /* ---------------- IMAGE SELECTION ---------------- */
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if it's an image or video
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      alert("Only images and videos allowed");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
    setImageToSend(file);
  };

  const cancelImageSend = () => {
    setImagePreviewUrl(null);
    setImageToSend(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* ---------------- SEND MEDIA (IMAGE/VIDEO) ---------------- */
  const sendMedia = async () => {
    if (!imageToSend) return;

    setUploadingImage(true);

    const tempId = `temp_media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileExt = imageToSend.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const path = `private-room-media/${id}/${fileName}`;
    const mediaType = imageToSend.type.startsWith("image/") ? "image" : "video";

    // Optimistic update
    const tempMessage = {
      id: tempId,
      room_id: id,
      user_id: userId,
      content: "",
      media_path: path,
      media_type: mediaType,
      view_once: false,
      created_at: new Date().toISOString(),
      is_read: false,
      profiles: userProfile,
      is_sending: true,
      public_url: imagePreviewUrl // Use preview URL temporarily
    };

    setMessages((prev) => [...prev, tempMessage]);
    setOptimisticIds(prev => new Set([...prev, tempId]));
    scrollToBottom();

    try {
      // 1. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("massage-media")
        .upload(path, imageToSend);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from("massage-media")
        .getPublicUrl(path);

      // 2. Insert to database
      const { data: insertedData, error: insertError } = await supabase
        .from("private_room_messages")
        .insert({
          room_id: id,
          user_id: userId,
          content: "",
          media_path: path,
          media_type: mediaType,
          view_once: false,
          is_read: false
        })
        .select(`
          id, 
          user_id, 
          content, 
          media_path, 
          media_type, 
          view_once, 
          created_at,
          is_read,
          profiles:user_id (username, avatar_url)
        `)
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Replace optimistic message with real one
      setMessages(prev => {
        const newMessages = prev.filter(msg => msg.id !== tempId);
        const messageWithUrl = {
          ...insertedData,
          public_url: publicUrlData.publicUrl
        };
        return [...newMessages, messageWithUrl];
      });

    } catch (error) {
      console.error("Error sending media:", error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      alert("Failed to send media");
    } finally {
      setOptimisticIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
      setUploadingImage(false);
      cancelImageSend();
    }
  };

  /* ---------------- OPEN VIEW-ONCE MEDIA ---------------- */
  const openViewOnceMedia = async (msg) => {
    const { data } = supabase.storage
      .from("massage-media")
      .getPublicUrl(msg.media_path);

    setPreviewImage({
      ...msg,
      url: data.publicUrl
    });

    // Delete message after viewing (if view_once is true)
    if (msg.view_once) {
      await supabase.from("private_room_messages").delete().eq("id", msg.id);
      setMessages((p) => p.filter((m) => m.id !== msg.id));
    }
  };

  // ---------------- Realtime updates (FIXED to avoid duplicates) ----------------
  useEffect(() => {
    if (!id || !userId) return;

    const channel = supabase
      .channel(`private-room-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_room_messages",
          filter: `room_id=eq.${id}`,
        },
        async (payload) => {
          // Skip if this is our own optimistic message
          if (optimisticIds.has(payload.new.id)) {
            return;
          }

          // Check if message already exists
          if (messages.some(m => m.id === payload.new.id)) {
            return;
          }

          // Fetch profile for new message
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", payload.new.user_id)
            .single();
          
          // Add public URL for media
          let publicUrl = null;
          if (payload.new.media_path) {
            const { data: urlData } = supabase.storage
              .from("massage-media")
              .getPublicUrl(payload.new.media_path);
            publicUrl = urlData.publicUrl;
          }
          
          const newMsgWithProfile = {
            ...payload.new,
            profiles: profile,
            public_url: publicUrl,
            is_sending: false
          };
          
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, newMsgWithProfile];
          });
          scrollToBottom();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "private_room_messages",
        },
        (payload) => {
          // Remove deleted message from local state
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, userId, messages.length, optimisticIds]);

  // ---------------- Initial load ----------------
  useEffect(() => {
    if (userId) {
      fetchRoom();
      fetchMessages();
    }
  }, [id, userId]);

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading private room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 flex flex-col">
      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh]">
            {previewImage.media_type === "image" ? (
              <img
                src={previewImage.url}
                alt="view once"
                className="rounded-xl max-w-full max-h-[80vh] object-contain shadow-2xl"
              />
            ) : (
              <video
                src={previewImage.url}
                controls
                autoPlay
                className="rounded-xl max-w-full max-h-[80vh] object-contain shadow-2xl"
              />
            )}
            <button
              className="absolute -top-3 -right-3 bg-gray-800 hover:bg-gray-700 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-colors"
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* MEDIA PREVIEW BEFORE SENDING */}
      {imagePreviewUrl && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-gray-800/90 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-gray-700 shadow-2xl">
            <h3 className="text-white text-xl font-semibold mb-4">
              {imageToSend?.type.startsWith("image/") ? "Preview Photo" : "Preview Video"}
            </h3>
            
            <div className="mb-6 flex justify-center">
              {imageToSend?.type.startsWith("image/") ? (
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  className="max-h-72 rounded-xl object-contain shadow-lg"
                />
              ) : (
                <video
                  src={imagePreviewUrl}
                  controls
                  className="max-h-72 rounded-xl shadow-lg"
                />
              )}
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
                onClick={sendMedia}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <>
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    Sending...
                  </>
                ) : (
                  `Send ${imageToSend?.type.startsWith("image/") ? "Photo" : "Video"}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            {/* Room Info */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={room.image_url || "/room-default.png"}
                  alt={room.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-blue-500/30"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center border border-gray-900">
                  <Lock className="w-2 h-2 text-white" />
                </div>
              </div>
              <div>
                <h1 className="font-bold text-white text-lg">{room.name}</h1>
                <p className="text-xs text-gray-400">Private Room Chat</p>
              </div>
            </div>
          </div>

          {/* View Details Button */}
          <button
            onClick={() => navigate(`/privateroomdetails/${id}`)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-6xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-24 h-24 rounded-full bg-gray-800/50 flex items-center justify-center mb-4 border border-dashed border-gray-700">
              <Send className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Welcome to {room.name}!</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              This is the beginning of your private room conversation. Send a message or media to get started!
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Lock className="w-4 h-4" />
              <span>This is a private room • Only members can see messages</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-20">
            {messages.map((message) => {
              const isSent = message.user_id === userId;
              const isSending = message.is_sending;
              
              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${isSent ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`${isSent ? 'order-2' : 'order-1'}`}>
                    <img
                      src={message.profiles?.avatar_url || "/avatar-default.png"}
                      className="w-8 h-8 rounded-full border-2 border-gray-700 object-cover"
                      alt={message.profiles?.username || "User"}
                    />
                  </div>

                  {/* Message Bubble with always-visible delete icon for sender */}
<div className={`${isSent ? 'order-1' : 'order-2'} max-w-[70%]`}>
  <div className={`px-4 py-3 rounded-2xl ${
    isSent
      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
      : 'bg-gray-800/50 text-gray-100 rounded-bl-none'
  } relative`}>
    {/* Top row: username (if receiver) + time + delete */}
    <div className="flex items-center justify-between mb-2">
      <div className="text-xs opacity-80">
        {!isSent && (
          <span className="font-medium text-gray-300 mr-2">
            {message.profiles?.username || "User"}
          </span>
        )}
        <span className="text-white/70">
          {new Date(message.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
      
      {/* Read status + Delete button (for sent messages) */}
      <div className="flex items-center gap-2">
        {isSent && (
          <>
            <span className="flex items-center">
              {isSending ? (
                <Clock className="w-3 h-3 text-white/70 animate-pulse" />
              ) : message.is_read ? (
                <CheckCheck className="w-3 h-3 text-blue-300" />
              ) : (
                <Check className="w-3 h-3 text-white/70" />
              )}
            </span>
            <button
              onClick={() => deleteMessage(message.id)}
              className="text-xs opacity-60 hover:opacity-100 hover:text-red-300 transition-opacity text-white/70 hover:text-white"
              title="Delete message"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
    
    {/* Message content */}
    {message.media_type === "image" ? (
      <div className="mt-1">
        {message.view_once ? (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-black/30 hover:bg-black/40 rounded-lg transition-colors w-full text-white"
            onClick={() => openViewOnceMedia(message)}
          >
            <ImageIcon className="w-5 h-5" />
            View photo (once)
          </button>
        ) : (
          <img
            src={message.public_url}
            alt="Sent"
            className="max-w-full rounded-lg shadow-inner cursor-pointer hover:opacity-90 transition-opacity"
            loading="lazy"
            onClick={() => setPreviewImage({
              ...message,
              url: message.public_url
            })}
          />
        )}
      </div>
    ) : message.media_type === "video" ? (
      <div className="mt-1">
        {message.view_once ? (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-black/30 hover:bg-black/40 rounded-lg transition-colors w-full text-white"
            onClick={() => openViewOnceMedia(message)}
          >
            <VideoIcon className="w-5 h-5" />
            View video (once)
          </button>
        ) : (
          <video
            src={message.public_url}
            controls
            className="max-w-full rounded-lg shadow-inner"
          />
        )}
      </div>
    ) : (
      <div className="break-words text-white/90">{message.content}</div>
    )}
  </div>
</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          {/* Media Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            disabled={uploadingImage}
            className={`flex-shrink-0 p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 transition ${
              uploadingImage ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {uploadingImage ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <ImageIcon className="w-5 h-5 text-gray-300" />
            )}
          </button>

          <input
            type="file"
            accept="image/*,video/*"
            hidden
            ref={fileInputRef}
            onChange={handleImageSelect}
            disabled={uploadingImage}
          />

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!userId || sending || uploadingImage}
              className="w-full px-5 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending || !userId || uploadingImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        
        {/* Input Hint */}
        <div className="text-center mt-2">
          <p className="text-xs text-gray-500">
            Press <span className="bg-gray-800 px-2 py-1 rounded text-gray-300 mx-1">Enter</span> to send • 
            <span className="text-blue-400 ml-1">Shift + Enter</span> for new line
          </p>
        </div>
      </div>
    </div>
  );
}
