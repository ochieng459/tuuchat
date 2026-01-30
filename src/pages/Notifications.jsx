import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";
import { Users, Lock, MessageCircle, ArrowLeft, Bell, CheckCircle, XCircle } from "lucide-react";

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        fetchNotifications(user.id);
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchNotifications = async (userId) => {
    setLoading(true);

    const { data, error } = await supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error) setNotifications(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl">
                <Bell className="w-6 h-6 text-purple-400" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Notifications
              </h1>
            </div>
          </div>
          
          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 text-gray-600">
              <Bell className="w-full h-full" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No notifications yet</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              When you get added to groups or receive support messages, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((note) => {
              let icon = null;
              let bgColor = "from-gray-600 to-gray-700";
              let textColor = "text-gray-300";
              let iconBg = "bg-gray-700";
              let label = "";
              
              switch (note.type) {
                case "group":
                  icon = <Users className="w-5 h-5" />;
                  bgColor = "from-purple-600/10 to-pink-600/10";
                  textColor = "text-purple-300";
                  iconBg = "bg-gradient-to-r from-purple-600 to-pink-600";
                  label = "Group Invite";
                  break;
                case "private_room":
                  icon = <Lock className="w-5 h-5" />;
                  bgColor = "from-indigo-600/10 to-blue-600/10";
                  textColor = "text-indigo-300";
                  iconBg = "bg-gradient-to-r from-indigo-600 to-blue-600";
                  label = "Private Room";
                  break;
                case "support_message":
                  icon = <MessageCircle className="w-5 h-5" />;
                  bgColor = "from-emerald-600/10 to-teal-600/10";
                  textColor = "text-emerald-300";
                  iconBg = "bg-gradient-to-r from-emerald-600 to-teal-600";
                  label = "Support";
                  break;
              }

              return (
                <div
                  key={`${note.type}-${note.ref_id}-${note.created_at}`}
                  className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r ${bgColor} border border-gray-800 hover:border-gray-700 transition-all duration-300 cursor-pointer group hover:scale-[1.02] active:scale-[0.99]`}
                  onClick={() => {
                    if (note.type === "group") {
                      navigate(`/groups/${note.ref_id}`);
                    } else if (note.type === "support_message") {
                      navigate(`/my-tickets`);
                    }
                  }}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  <div className="relative flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-14 h-14 ${iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
                      {icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${iconBg} bg-opacity-20 border border-opacity-20 ${textColor}`}>
                          {label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        {note.type === "group" && (
                          <p className="text-lg font-semibold text-white">
                            Added to Group: <span className="text-purple-300">{note.title}</span>
                          </p>
                        )}
                        {note.type === "private_room" && (
                          <p className="text-lg font-semibold text-white">
                            Added to Private Room: <span className="text-indigo-300">{note.title}</span>
                          </p>
                        )}
                        {note.type === "support_message" && (
                          <p className="text-lg font-semibold text-white">
                            New Support Message: <span className="text-emerald-300 italic">{note.title}</span>
                          </p>
                        )}
                        
                        {note.message && (
                          <p className="text-gray-400 text-sm leading-relaxed">
                            {note.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Indicator */}
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
                    </div>
                  </div>

                  {/* Bottom border with time */}
                  <div className="relative mt-4 pt-4 border-t border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(note.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="text-xs text-gray-400">
                        Click to {note.type === "support_message" ? "view ticket" : "open"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        {notifications.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="flex gap-3">
            </div>
          </div>
        )}
      </main>
    </div>
  );
}