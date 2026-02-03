import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { ArrowLeft, Lock, User, Users, Calendar, MessageSquare, Shield, ImageIcon, Globe, Mail, Loader2 } from "lucide-react";

export default function PrivateRoomDetails() {
  const { id } = useParams(); // room ID
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [membersCount, setMembersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [createdDate, setCreatedDate] = useState(null);

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  // Check if user has access
  const checkUserAccess = async () => {
    if (!userId) return;
    
    setCheckingAccess(true);
    try {
      const { data, error } = await supabase
        .from("room_access")
        .select("user_id")
        .eq("room_id", id)
        .eq("user_id", userId)
        .single();

      if (data) {
        setHasAccess(true);
      }
    } catch (err) {
      console.error("Error checking access:", err);
    } finally {
      setCheckingAccess(false);
    }
  };

  useEffect(() => {
    if (userId) {
      checkUserAccess();
    }
  }, [userId, id]);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      setLoading(true);

      try {
        // 1️⃣ Get room info + admin profile
        const { data: roomData, error: roomError } = await supabase
          .from("private_rooms")
          .select(`
            id,
            name,
            description,
            image_url,
            created_by,
            created_at,
            price,
            profiles(username, avatar_url)
          `)
          .eq("id", id)
          .single();

        if (roomError || !roomData) throw roomError || new Error("Room not found");

        setRoom(roomData);
        
        // Format created date
        if (roomData.created_at) {
          setCreatedDate(new Date(roomData.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }));
        }

        // 2️⃣ Count members
        const { count: memberCount, error: countError } = await supabase
          .from("room_access")
          .select("user_id", { count: "exact", head: true })
          .eq("room_id", id);

        if (countError) throw countError;
        setMembersCount(memberCount || 0);
      } catch (err) {
        console.error("Error fetching room details:", err);
        navigate("/home");
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [id, navigate]);

  const handleJoinRoom = () => {
    if (hasAccess) {
      navigate(`/privateroomchat/${id}`);
    } else {
      navigate(`/privateroom/${id}`); // Go to payment page
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading room details...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Lock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Room Not Found</h2>
          <p className="text-gray-400 mb-6">The room you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate("/home")}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all"
          >
            Browse Other Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Room Details
          </h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Room Header Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-700 shadow-xl shadow-black/20">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Room Image */}
            <div className="w-full md:w-1/3">
              <div className="relative w-full h-64 rounded-xl overflow-hidden">
                <img
                  src={room.image_url || "/room-default.png"}
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Private Room</span>
                </div>
                {room.price && (
                  <div className="absolute top-3 right-3 px-3 py-1.5 bg-blue-900/70 backdrop-blur-sm rounded-full">
                    <span className="text-sm font-bold text-white">KES {room.price}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Room Info */}
            <div className="flex-1">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-3">{room.name}</h1>
                
                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-sm text-gray-400 mb-2">Description</h3>
                  <p className="text-gray-300 leading-relaxed">
                    {room.description || "No description provided for this private room."}
                  </p>
                </div>

                {/* Creator Info */}
                <div className="flex items-center gap-3 p-4 bg-gray-900/40 rounded-xl mb-6">
                  <img
                    src={room.profiles?.avatar_url || "/avatar-default.png"}
                    alt={room.profiles?.username || "Admin"}
                    className="w-12 h-12 rounded-full border-2 border-blue-500/30 object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-400">Room Creator</p>
                    <p className="text-lg font-medium text-white">{room.profiles?.username || "Admin"}</p>
                  </div>
                  {createdDate && (
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{createdDate}</span>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-900/40 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Members</span>
                    </div>
                    <p className="text-xl font-bold text-white">{membersCount}</p>
                  </div>
                  
                  <div className="bg-gray-900/40 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">Access Type</span>
                    </div>
                    <p className="text-xl font-bold text-white">Private</p>
                  </div>
                  
                  <div className="bg-gray-900/40 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm">Status</span>
                    </div>
                    <p className={`text-xl font-bold ${hasAccess ? 'text-green-400' : 'text-yellow-400'}`}>
                      {checkingAccess ? "Checking..." : hasAccess ? "Access" : "No Access"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            About This Room
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Privacy Level</p>
                <p className="text-sm text-gray-400">
                  This is a private room. Only members who have been granted access can view and participate in conversations.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Membership</p>
                <p className="text-sm text-gray-400">
                  Currently has <span className="text-blue-400 font-semibold">{membersCount}</span> member{membersCount !== 1 ? 's' : ''}. 
                  Membership is managed by the room creator.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-900/20 flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Visibility</p>
                <p className="text-sm text-gray-400">
                  This room appears in the public directory but requires access to view content and participate in conversations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            
            <button
              onClick={() => navigate(-1)}
              className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
          
          {hasAccess && (
            <p className="text-center text-green-400 text-sm mt-4">
              ✓ You have access to this room. Click above to enter the chat.
            </p>
          )}
          
          {!hasAccess && userId && (
            <p className="text-center text-yellow-400 text-sm mt-4">
              
            </p>
          )}
          
          {!userId && (
            <p className="text-center text-red-400 text-sm mt-4">
              Please log in to check your access status.
            </p>
          )}
        </div>

        {/* Contact Admin */}
        
      </main>
    </div>
  );
}