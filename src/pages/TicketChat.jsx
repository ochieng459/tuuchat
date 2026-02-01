import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  User,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  Ticket,
  Shield,
  Mail,
  UserCog,
  MoreVertical,
  ChevronRight,
  Copy,
  Download
} from "lucide-react";

export default function TicketChat() {
  const { id } = useParams(); // ticket ID
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [ticketInfo, setTicketInfo] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchUserAndMessages = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate("/login");
        return;
      }

      setUser(userData.user);

      // Fetch ticket info
      const { data: ticketData, error: ticketError } = await supabase
        .from("help")
        .select("*")
        .eq("id", id)
        .single();

      if (ticketError) {
        console.error("Error fetching ticket:", ticketError);
      } else {
        setTicketInfo(ticketData);
      }

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("help_messages")
        .select("*")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
      } else {
        setMessages(messagesData || []);
      }

      setLoading(false);
    };

    fetchUserAndMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`ticket-chat:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'help_messages',
          filter: `ticket_id=eq.${id}`
        },
        (payload) => {
          setMessages(prev => {
            if (prev.some(msg => msg.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, navigate]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    const tempId = Date.now(); // Temporary ID for optimistic update

    // Optimistic update
    const tempMessage = {
      id: tempId,
      ticket_id: id,
      sender_id: user.id,
      message: newMessage.trim(),
      created_at: new Date().toISOString(),
      optimistic: true
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");

    const { error } = await supabase.from("help_messages").insert({
      ticket_id: id,
      sender_id: user.id,
      message: newMessage.trim()
    });

    setSending(false);

    if (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };

  const statusConfig = (status) => {
    switch (status) {
      case "open":
        return {
          color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
          icon: <AlertCircle className="w-4 h-4" />,
          label: "Open"
        };
      case "in_progress":
        return {
          color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
          icon: <Clock className="w-4 h-4" />,
          label: "In Progress"
        };
      case "resolved":
        return {
          color: "bg-green-500/20 text-green-300 border-green-500/30",
          icon: <CheckCircle className="w-4 h-4" />,
          label: "Resolved"
        };
      default:
        return {
          color: "bg-gray-500/20 text-gray-300 border-gray-500/30",
          icon: <Ticket className="w-4 h-4" />,
          label: "Unknown"
        };
    }
  };

  const status = ticketInfo ? statusConfig(ticketInfo.status) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading ticket conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-4 py-3">
        <div className="max-w-6xl mx-auto">
          {/* Top Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            {/* Left Section */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </button>

              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shrink-0">
                  <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-bold text-white truncate max-w-[160px] sm:max-w-md">
                    {ticketInfo?.subject || "Support Ticket"}
                  </h1>

                  <p className="text-xs text-gray-400 truncate">
                    Ticket ID: #{id?.slice(0, 8)}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            {status && (
              <div className={`self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${status.color} text-xs sm:text-sm font-medium`}>
                {status.icon}
                {status.label}
              </div>
            )}
          </div>

          {/* Ticket Info Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-gray-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>
                  Created: {new Date(ticketInfo?.created_at).toLocaleDateString()}
                </span>
              </div>

              {ticketInfo?.updated_at !== ticketInfo?.created_at && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>
                    Updated: {new Date(ticketInfo?.updated_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/help")}
              className="w-full sm:w-auto px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Ticket className="w-3 h-3" />
              New Ticket
            </button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No messages yet</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Start the conversation by sending your first message. Our support team will respond as soon as possible.
              </p>
              <div className="bg-blue-900/20 rounded-xl p-4 max-w-md mx-auto border border-blue-700/30">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-white mb-1">Support Hours</h4>
                    <p className="text-xs text-blue-300">
                      Our team is available Monday-Friday, 9 AM - 6 PM. Responses may be delayed outside these hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Initial Ticket Message */}
              <div className="text-center mb-8">
                <div className="inline-block bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-700 max-w-2xl">
                  <div className="flex items-center gap-2 justify-center mb-2">
                    <Ticket className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-400">Ticket Created</span>
                  </div>
                  <p className="text-gray-300 mb-2">{ticketInfo?.message}</p>
                  <div className="text-xs text-gray-500">
                    {new Date(ticketInfo?.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              {messages.map((msg, i) => {
                const isCurrentUser = msg.sender_id === user?.id;
                const isSupport = msg.sender_id !== user?.id; // In a real app, you'd check if sender is support agent
                const time = new Date(msg.created_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });

                return (
                  <div
                    key={msg.id || i}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] lg:max-w-[70%] ${
                      isCurrentUser 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl rounded-tr-none' 
                        : isSupport
                        ? 'bg-gradient-to-r from-gray-800 to-gray-700 text-gray-200 rounded-2xl rounded-tl-none border border-gray-700'
                        : 'bg-gray-800 text-gray-200 rounded-2xl rounded-tl-none'
                    } p-4 shadow-lg`}>
                      {/* Message Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isSupport ? (
                            <div className="flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-green-400" />
                              <span className="text-xs font-medium text-gray-300">Support Agent</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-blue-400" />
                              <span className="text-xs font-medium text-gray-300">You</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs opacity-80">{time}</span>
                          {msg.optimistic && (
                            <Loader2 className="w-3 h-3 animate-spin opacity-60" />
                          )}
                        </div>
                      </div>

                      {/* Message Content */}
                      <p className="text-white/90">{msg.message}</p>

                      {/* Message Footer */}
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between text-xs opacity-60">
                          <span>
                            {new Date(msg.created_at).toLocaleDateString()}
                          </span>
                          {isSupport && (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Official Support
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Form */}
      <div className="sticky bottom-0 bg-gray-900/80 backdrop-blur-md border-t border-gray-800 px-2 sm:px-4 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={sendMessage}
            className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3"
          >
            {/* Tickets Button */}
            <button
              type="button"
              onClick={() => navigate("/my-tickets")}
              className="p-2.5 sm:p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors shrink-0"
              title="My Tickets"
            >
              <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
            </button>

            {/* Input */}
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1 min-w-0 px-3 sm:px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className={`px-3 sm:px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shrink-0 ${
                sending || !newMessage.trim()
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-blue-500/25'
              }`}
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="hidden sm:inline">Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Tips */}
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">
              💡 For faster resolution, include screenshots or detailed error messages
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Calendar icon component
const Calendar = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);