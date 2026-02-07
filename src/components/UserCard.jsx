import React, { useState } from "react";
import { Heart, MessageCircle, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase"; // ✅ your folder path
import avatarPlaceholder from "../assets/avatar-placeholder.png";

export default function UserCard({ user, currentUserId }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  const avatarSrc =
    !user.avatar_url || imgError ? avatarPlaceholder : user.avatar_url;

  // ❤️ Like toggle
  const handleLike = async (e) => {
    e.stopPropagation();
    if (!currentUserId || liking) return;

    try {
      setLiking(true);

      if (!liked) {
        await supabase.from("user_likes").insert({
          user_id: currentUserId,
          target_type: "user",
          target_id: user.id,
        });
        setLiked(true);
      } else {
        await supabase
          .from("user_likes")
          .delete()
          .eq("user_id", currentUserId)
          .eq("target_type", "user")
          .eq("target_id", user.id);

        setLiked(false);
      }
    } catch (err) {
      console.error("Like error:", err);
    } finally {
      setLiking(false);
    }
  };

  // 💬 Go to chat
  const goChat = (e) => {
    e.stopPropagation();
    navigate(`/chat/${user.id}`);
  };

  // 👤 Go to profile + log view
  const goProfile = async (e) => {
    e.stopPropagation();
    navigate(`/users/${user.id}`);

    if (currentUserId && currentUserId !== user.id) {
      await supabase.from("profile_views").insert({
        viewer_id: currentUserId,
        profile_id: user.id,
      });
    }
  };

  return (
    <div className="relative group w-full h-64 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500/40 transition-all cursor-pointer">

      {/* Full Card Image */}
      <img
        src={avatarSrc}
        alt={user.username}
        onError={() => setImgError(true)}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* 🔔 Unread Badge (Top Right) */}
      {user.unreadCount > 0 && (
        <div className="absolute top-2 right-2">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
              {user.unreadCount > 9 ? "9+" : user.unreadCount}
            </div>
          </div>
        </div>
      )}

      {/* Username */}
      <div className="absolute bottom-12 left-3 right-3">
        <h3 className="text-white font-semibold text-sm truncate">
          {user.username}
        </h3>
      </div>

     {/* Bottom Action Bar */}
<div className="absolute bottom-0 left-0 right-0 p-2 flex gap-2 items-center bg-black/40 backdrop-blur-sm">


  {/* 👤 Profile */}
  <button
    onClick={goProfile}
    className="flex-1 p-2 rounded-lg bg-purple-600/30 text-purple-300 hover:bg-purple-600/40 transition flex items-center justify-center"
    title="Profile"
  >
    <User className="w-5 h-5" />
  </button>

  {/* 💬 Message */}
  <button
    onClick={goChat}
    className="flex-1 p-2 rounded-lg bg-gray-700/60 text-gray-300 hover:bg-gray-600 transition flex items-center justify-center"
    title="Message"
  >
    <MessageCircle className="w-5 h-5" />
  </button>

  

</div>

    </div>
  );
}
