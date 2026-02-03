import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { ArrowLeft, Eye, Send, Lock, User, ImageIcon, Loader2, Clock, X, VideoIcon } from "lucide-react";

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
      .select("id, user_id, content, media_path, media_type, view_once, created_at, profiles(username, avatar_url)")
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

  // ---------------- Send message ----------------
  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    setSending(true);

    const { data, error } = await supabase
      .from("private_room_messages")
      .insert([{ 
        room_id: id, 
        user_id: userId, 
        content: newMessage 
      }])
      .select()
      .single();

    if (error) {
      console.error("Send message error", error);
    } else {
      // Add user profile to the new message
      const newMsgWithProfile = {
        ...data,
        profiles: userProfile
      };
      setMessages((prev) => [...prev, newMsgWithProfile]);
      setNewMessage("");
      scrollToBottom();
    }

    setSending(false);
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

    try {
      const fileExt = imageToSend.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const path = `private-room-media/${id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("massage-media")
        .upload(path, imageToSend);

      if (uploadError) {
        console.error("Upload error:", uploadError.message);
        alert("Failed to upload media");
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("massage-media")
        .getPublicUrl(path);

      const mediaType = imageToSend.type.startsWith("image/") ? "image" : "video";

      const tempMessage = {
        id: crypto.randomUUID(),
        room_id: id,
        user_id: userId,
        content: "",
        media_path: path,
        media_type: mediaType,
        view_once: false, // Change to true if you want view-once in private rooms
        created_at: new Date().toISOString(),
        public_url: publicUrlData.publicUrl,
        profiles: userProfile
      };

      setMessages((prev) => [...prev, tempMessage]);
      scrollToBottom();

      const { error: insertError } = await supabase
        .from("private_room_messages")
        .insert({
          room_id: id,
          user_id: userId,
          content: "",
          media_path: path,
          media_type: mediaType,
          view_once: false
        });

      if (insertError) {
        console.error("Insert error:", insertError.message);
        setMessages((prev) => prev.filter(m => m.id !== tempMessage.id));
        alert("Failed to send media");
      }

    } catch (error) {
      console.error("Error sending media:", error);
      alert("Error sending media");
    } finally {
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
    await supabase.from("private_room_messages").delete().eq("id", msg.id);
    setMessages((p) => p.filter((m) => m.id !== msg.id));
  };

  // ---------------- Realtime updates ----------------
  useEffect(() => {
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
            public_url: publicUrl
          };
          setMessages((prev) => [...prev, newMsgWithProfile]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id]);

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

                  {/* Message Bubble */}
                  <div className={`${isSent ? 'order-1' : 'order-2'} max-w-[70%]`}>
                    <div className={`px-4 py-3 rounded-2xl ${
                      isSent
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                        : 'bg-gray-800/50 text-gray-100 rounded-bl-none'
                    }`}>
                      {!isSent && (
                        <div className="font-medium text-xs text-gray-300 mb-1">
                          {message.profiles?.username || "User"}
                        </div>
                      )}
                      
                      {message.media_type === "image" ? (
                        <div className="mt-2">
                          {message.view_once ? (
                            <button
                              className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 hover:bg-gray-900/70 rounded-lg transition-colors"
                              onClick={() => openViewOnceMedia(message)}
                            >
                              <ImageIcon className="w-5 h-5" />
                              View photo (once)
                            </button>
                          ) : (
                            <img
                              src={message.public_url}
                              alt="Sent"
                              className="max-w-full rounded-lg mt-1 shadow-inner cursor-pointer hover:opacity-90 transition-opacity"
                              loading="lazy"
                              onClick={() => setPreviewImage({
                                ...message,
                                url: message.public_url
                              })}
                            />
                          )}
                        </div>
                      ) : message.media_type === "video" ? (
                        <div className="mt-2">
                          {message.view_once ? (
                            <button
                              className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 hover:bg-gray-900/70 rounded-lg transition-colors"
                              onClick={() => openViewOnceMedia(message)}
                            >
                              <VideoIcon className="w-5 h-5" />
                              View video (once)
                            </button>
                          ) : (
                            <video
                              src={message.public_url}
                              controls
                              className="max-w-full rounded-lg mt-1 shadow-inner"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="break-words">{message.content}</div>
                      )}
                    </div>
                    
                    {/* Timestamp */}
                    <div className={`text-xs text-gray-500 mt-1 flex items-center gap-1 ${
                      isSent ? 'justify-end' : 'justify-start'
                    }`}>
                      <Clock className="w-3 h-3" />
                      {new Date(message.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
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