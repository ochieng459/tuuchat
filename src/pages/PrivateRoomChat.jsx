import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { Loader2, Send } from "lucide-react";

export default function PrivateRoomChat() {
  const { id } = useParams(); // room ID
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // ---------------- Fetch room details ----------------
  const fetchRoom = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("private_rooms")
      .select(`id, name, description, image_url`)
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Room not found", error);
      navigate("/home");
      return;
    }

    setRoom(data);
    setLoading(false);
  };

  // ---------------- Fetch messages ----------------
  const fetchMessages = async () => {
    const { data } = await supabase
      .from("private_room_messages")
      .select("id, user_id, content, created_at, profiles(username, avatar_url)")
      .eq("room_id", id)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  };

  // ---------------- Send message ----------------
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);

    const { data, error } = await supabase
      .from("private_room_messages")
      .insert([{ room_id: id, content: newMessage }])
      .select()
      .single();

    if (error) {
      console.error("Send message error", error);
    } else {
      fetchMessages(); // refresh messages
      setNewMessage("");
    }

    setSending(false);
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
          filter: `room_id=eq.${id}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id]);

  // ---------------- Initial load ----------------
  useEffect(() => {
    fetchRoom();
    fetchMessages();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="animate-spin h-10 w-10 text-purple-500" />
        <p className="mt-4 text-gray-400">Loading room...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-4">
      {/* Room header */}
      <div className="flex items-center space-x-4 mb-4">
        <img
          src={room.image_url || "/room-default.png"}
          alt={room.name}
          className="w-12 h-12 object-cover rounded-full"
        />
        <h1 className="text-xl font-bold">{room.name}</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center mt-4">No messages yet</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex items-start space-x-2">
              <img
                src={m.profiles?.avatar_url || "/avatar-default.png"}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <div className="text-sm font-semibold">{m.profiles?.username || "User"}</div>
                <div className="text-gray-100">{m.content}</div>
                <div className="text-xs text-gray-500">{new Date(m.created_at).toLocaleTimeString()}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 rounded-xl px-3 py-2 bg-gray-800 text-white placeholder-gray-400 focus:outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={sending}
          className="bg-purple-600 px-4 py-2 rounded-xl text-white hover:bg-purple-700 disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
