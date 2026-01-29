import React from "react"
import {
  Pin,
  X,
  MessageCircle,
  CheckCircle,
  Clock,
  UserMinus
} from "lucide-react"

export default function UserCard({
  user,
  isPrivate = false,
  onAddToPrivate,
  onRemove,
  onClick
}) {
  return (
    <div
      className="group bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 border border-gray-700 hover:border-purple-500/30 transition-all duration-200 cursor-pointer w-full"
      onClick={onClick}
    >
      {/* Online Status & Unread Badge Container */}
      <div className="flex justify-between items-start mb-3">
        {/* Online Status Indicator */}
        <div className={`w-2 h-2 rounded-full ${user.is_online ? 'bg-green-500' : 'bg-gray-500'}`} />
        
        {/* Unread Message Badge */}
        {user.unreadCount > 0 && (
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {user.unreadCount > 9 ? '9+' : user.unreadCount}
            </div>
          </div>
        )}
      </div>

      {/* User Avatar */}
      <div className="relative mx-auto mb-3">
        <div className="w-14 h-14 rounded-full border-2 border-purple-500/20 p-0.5 group-hover:border-purple-500/40 transition-colors mx-auto">
          <img
            src={user.avatar_url || "https://via.placeholder.com/56"}
            alt={user.username}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
        
        {/* Active Status Ring for online users */}
        {user.is_online && (
          <div className="absolute inset-0 rounded-full border border-green-500/30 animate-ping"></div>
        )}
      </div>

      {/* User Info */}
      <div className="text-center mb-3">
        <h3 className="font-medium text-white text-sm truncate group-hover:text-purple-300 transition-colors px-1">
          {user.username}
        </h3>
        
        {/* Status Text */}
        <div className="mt-1">
          {user.is_online ? (
            <span className="inline-flex items-center justify-center gap-1 text-[10px] text-green-400">
              <CheckCircle className="w-2.5 h-2.5" />
              Online
            </span>
          ) : (
            <span className="text-[10px] text-gray-500">Offline</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1.5">
        {/* Message Button - Always visible */}
        <button
          className="flex-1 px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-[10px] font-medium transition-colors flex items-center justify-center gap-1"
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
          title="Message"
        >
          <MessageCircle className="w-3 h-3" />
        </button>

        {/* Pin/Remove Button */}
        {!isPrivate && onAddToPrivate && (
          <button
            className="flex-1 px-2 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg text-[10px] font-medium transition-colors flex items-center justify-center gap-1"
            onClick={(e) => {
              e.stopPropagation()
              onAddToPrivate()
            }}
            title="Pin"
          >
            <Pin className="w-3 h-3" />
          </button>
        )}

        {isPrivate && onRemove && (
          <button
            className="flex-1 px-2 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-[10px] font-medium transition-colors flex items-center justify-center gap-1"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            title="Remove"
          >
            <UserMinus className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  )
}