// src/components/GroupCard.jsx
import React from "react"

export default function GroupCard({ group, onClick, onCreateGroup }) {
  // If no group is provided, render "Create New Group" card
  if (!group) {
    return (
      <div
        className="flex flex-col items-center justify-center w-20 h-24 bg-gray-800 rounded-md cursor-pointer hover:bg-gray-700 transition"
        onClick={onCreateGroup}
      >
        <div className="text-2xl font-bold text-purple-400">+</div>
        <p className="text-sm text-gray-300 mt-1 text-center">New Group</p>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col items-center w-20 cursor-pointer"
      onClick={onClick}
    >
      <img
        src={group.avatar_url || "https://via.placeholder.com/40"}
        alt={group.name}
        className="w-16 h-16 rounded-full object-cover border border-gray-700"
      />
      <p className="text-sm text-center mt-1 truncate w-full">{group.name}</p>
    </div>
  )
}
