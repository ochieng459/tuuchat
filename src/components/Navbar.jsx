// src/components/Navbar.jsx
import React from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

export default function Navbar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  const linkClasses = ({ isActive }) =>
    `px-3 py-2 rounded-md font-medium ${
      isActive ? "bg-purple-500 text-gray-900" : "text-gray-300 hover:bg-gray-700"
    } transition`

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-purple-400">tuuChat</h1>

        <NavLink to="/home" className={linkClasses}>
          Public
        </NavLink>

        <NavLink to="/private" className={linkClasses}>
          Private
        </NavLink>

        <NavLink to="/groups" className={linkClasses}>
          Groups
        </NavLink>
      </div>

      <div className="flex items-center gap-3">
        <NavLink to="/profile" className="text-gray-300 hover:text-white">
          Profile
        </NavLink>
        
      </div>
    </nav>
  )
}
