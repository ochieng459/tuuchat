import { useState } from "react";
import { FaBars } from "react-icons/fa"; // Hamburger icon
import { AiOutlineClose } from "react-icons/ai"; // Close icon

export default function ChatHeader({ user, onClear, onAddToGroup, onBlock, onAddToPrivate }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="chat-header flex justify-between items-center p-4 bg-blue-600 text-white">
      <h2 className="text-lg font-bold">{user.username}</h2>

      {/* Desktop nav */}
      <div className="hidden md:flex gap-4">
        <button onClick={onClear} className="hover:bg-blue-500 px-3 py-1 rounded">Clear</button>
        <button onClick={onAddToGroup} className="hover:bg-blue-500 px-3 py-1 rounded">Add to Group</button>
        <button onClick={onBlock} className="hover:bg-blue-500 px-3 py-1 rounded">Block</button>
        <button onClick={onAddToPrivate} className="hover:bg-blue-500 px-3 py-1 rounded">Add to Private</button>
      </div>

      {/* Mobile Hamburger */}
      <div className="md:hidden">
        <button onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <AiOutlineClose size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-16 right-4 bg-white text-black rounded shadow-md flex flex-col gap-2 p-2 md:hidden z-50">
          <button onClick={onClear} className="hover:bg-gray-200 px-3 py-1 rounded text-left">Clear</button>
          <button onClick={onAddToGroup} className="hover:bg-gray-200 px-3 py-1 rounded text-left">Add to Group</button>
          <button onClick={onBlock} className="hover:bg-gray-200 px-3 py-1 rounded text-left">Block</button>
          <button onClick={onAddToPrivate} className="hover:bg-gray-200 px-3 py-1 rounded text-left">Add to Private</button>
        </div>
      )}
    </div>
  );
}
