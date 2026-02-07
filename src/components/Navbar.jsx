import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Lucide icons
import { Home, Lock, Users, User, LogOut } from "lucide-react";

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const linkClasses = ({ isActive }) =>
    `flex-1 sm:flex-none text-center px-3 py-2 rounded-lg text-sm font-medium transition
     ${isActive
      ? "bg-purple-500 text-gray-900"
      : "text-gray-300 hover:bg-gray-700 hover:text-white"
    }`;

  return (
    <nav className="w-full bg-gray-800 border-t border-gray-700">
      <div className="max-w-4xl mx-auto px-2 py-2">

        {/* Links */}
        <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center sm:justify-between">

          <NavLink to="/home" className={linkClasses}>
            <Home className="mx-auto w-5 h-5" />
          </NavLink>

          <NavLink to="/private" className={linkClasses}>
            <Lock className="mx-auto w-5 h-5" />
          </NavLink>

          <NavLink to="/groups" className={linkClasses}>
            <Users className="mx-auto w-5 h-5" />
          </NavLink>

          <NavLink to="/profile" className={linkClasses}>
            <User className="mx-auto w-5 h-5" />
          </NavLink>

        </div>

        

      </div>
    </nav>
  );
}
