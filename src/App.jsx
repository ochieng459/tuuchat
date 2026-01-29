import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import GroupChat from "./pages/GroupChat";
import GroupView from "./pages/GroupView";
import PrivateUsers from "./pages/PrivateUsers";
import Groups from "./pages/Groups";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";

// ✅ Help Pages
import Help from "./pages/Help";
import MyTickets from "./pages/MyTickets";
import TicketChat from "./pages/TicketChat"; // ✅ new page for viewing/replying to a ticket

import "./index.css";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route
          path="/"
          element={!user ? <Login /> : <Navigate to="/home" />}
        />
        <Route
          path="/signup"
          element={!user ? <Signup /> : <Navigate to="/home" />}
        />

        {/* Protected routes */}
        <Route
          path="/home"
          element={user ? <Home /> : <Navigate to="/" />}
        />
        <Route
          path="/private"
          element={user ? <PrivateUsers /> : <Navigate to="/" />}
        />
        <Route
          path="/groups"
          element={user ? <Groups /> : <Navigate to="/" />}
        />

        {/* Chats */}
        <Route
          path="/chat/:id"
          element={user ? <Chat /> : <Navigate to="/" />}
        />
        <Route
          path="/group/:id"
          element={user ? <GroupChat /> : <Navigate to="/" />}
        />

        {/* ✅ Group View Page */}
        <Route
          path="/groups/:id"
          element={user ? <GroupView /> : <Navigate to="/" />}
        />

        {/* Profiles */}
        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/" />}
        />
        <Route
          path="/users/:id"
          element={user ? <UserProfile /> : <Navigate to="/" />}
        />

        {/* ✅ Help / Support Pages */}
        <Route
          path="/help"
          element={user ? <Help /> : <Navigate to="/" />}
        />
        <Route
          path="/my-tickets"
          element={user ? <MyTickets /> : <Navigate to="/" />}
        />

        {/* ✅ Ticket Chat Page */}
        <Route
          path="/ticket/:id"
          element={user ? <TicketChat /> : <Navigate to="/" />}
        />

      </Routes>
    </BrowserRouter>
  );
}
