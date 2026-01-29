// src/components/HorizontalSection.jsx
import React from "react"

export default function HorizontalSection({ title, children }) {
  return (
    // In your parent component
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
  {users.map((user) => (
    <UserCard
      key={user.id}
      user={user}
      onClick={() => navigate(`/chat/${user.id}`)}
      // other props...
    />
  ))}
</div>
  )
}
