import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { ArrowLeft, Lock, User, CreditCard, Calendar, Shield, AlertCircle, Loader2, RefreshCw, Key } from "lucide-react";

export default function PrivateRoomsView() {
  const { id } = useParams(); // room ID from URL
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [checkingAccess, setCheckingAccess] = useState(false);

  // ✅ Fetch current user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        setUserId(user.id);
        setUserEmail(user.email);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Failed to fetch user");
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // ✅ Load room info
  useEffect(() => {
    const loadRoom = async () => {
      if (!userId) return; // wait until userId is loaded

      try {
        setLoading(true);
        setError(null);

        // 1️⃣ Fetch room info
        const roomRes = await fetch(`https://tuuchatserver-production.up.railway.app/api/rooms/${id}`);
        if (!roomRes.ok) throw new Error("Failed to fetch room");
        const roomData = await roomRes.json();
        setRoom(roomData);

        setLoading(false);
      } catch (err) {
        console.error("Load room error:", err);
        setError(err.message || "Failed to load room");
        setLoading(false);
      }
    };

    loadRoom();
  }, [id, userId]);

  // ✅ Check access function
  const checkAccess = async () => {
    if (!userId || !id) return;

    try {
      setCheckingAccess(true);

      const res = await fetch(
        `https://tuuchatserver-production.up.railway.app/api/rooms/${id}/access/${userId}`
      );

      if (!res.ok) throw new Error("Failed to check access");

      const data = await res.json();
      setHasAccess(data.has_access === true);
    } catch (err) {
      console.error("Error checking access:", err);
      setHasAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  // ✅ Poll for room access
  useEffect(() => {
    if (!userId) return;

    // Check immediately
    checkAccess();
    
    // Then every 3 seconds
    const interval = setInterval(checkAccess, 3000);
    return () => clearInterval(interval);
  }, [id, userId]);

  // ✅ Handle room payment via Paystack
  async function handlePay() {
    if (!userId || !userEmail) {
      setError("User not authenticated");
      return;
    }

    setPaying(true);

    try {
      const res = await fetch("https://tuuchatserver-production.up.railway.app/api/payments/deposit/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          email: userEmail,
          amount: room.price, // ✅ REQUIRED
          room_id: id,        // ✅ Pass room_id for webhook
        }),
      });

      if (!res.ok) throw new Error("Failed to initialize payment");

      const data = await res.json();
      if (!data.checkout_url) throw new Error("No checkout URL returned");

      // Redirect to Paystack checkout
      window.location.href = data.checkout_url;
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "Payment initialization failed");
      setPaying(false);
    }
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading room details...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate("/home")}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  // Room Not Found
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100">
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
            Private Room
          </h1>
          <button
            onClick={checkAccess}
            disabled={checkingAccess}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh access status"
          >
            <RefreshCw className={`w-4 h-4 ${checkingAccess ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Room Header Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-700 shadow-xl shadow-black/20">
          {/* Room Image */}
          <div className="relative mb-6">
            <img
              src={room.image_url || "/room-default.png"}
              className="w-full h-64 object-cover rounded-xl border border-gray-700"
              alt={room.name}
            />
            <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Private Room</span>
            </div>
            <div className="absolute top-3 right-3 px-3 py-1.5 bg-blue-900/70 backdrop-blur-sm rounded-full">
              <span className="text-sm font-bold text-white">KES {room.price}</span>
            </div>
          </div>

          {/* Room Title */}
          <h1 className="text-3xl font-bold text-white mb-4">{room.name}</h1>

          {/* Creator Info */}
          <div className="flex items-center gap-3 p-4 bg-gray-900/40 rounded-xl mb-6">
            <div className="relative">
              <img
                src={room.creator_avatar || "/user-default.png"}
                alt={room.creator_username || "Admin"}
                className="w-12 h-12 rounded-full border-2 border-blue-500/30"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center border-2 border-gray-900">
                <Key className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400">Room Creator</p>
              <p className="text-lg font-medium text-white">{room.creator_username || "Admin"}</p>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{room.created_at ? new Date(room.created_at).toLocaleDateString() : "Recently"}</span>
            </div>
          </div>

          {/* Price Display */}
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-xl border border-blue-500/20">
              <div>
                <p className="text-sm text-gray-400">Entry Price</p>
                <p className="text-2xl font-bold text-white">KES {room.price}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Access Type</p>
                <p className="font-medium text-blue-400">One-time Payment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            About This Room
          </h2>
          <div className="bg-gray-900/30 rounded-lg p-4">
            <p className="text-gray-300 leading-relaxed">
              {room.description || "No description provided for this private room."}
            </p>
          </div>
        </div>

        {/* Access Status */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Access Status</h3>
              <p className="text-sm text-gray-400">Real-time access verification</p>
            </div>
            <div className={`px-4 py-2 rounded-lg font-medium ${hasAccess 
              ? 'bg-green-900/30 text-green-400 border border-green-500/30' 
              : 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30'
            }`}>
              {hasAccess ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Access Granted
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                  No Access
                </span>
              )}
            </div>
          </div>

          {/* Status Info - Only show the access status without payment info when access is granted */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${hasAccess ? 'bg-green-900/20' : 'bg-gray-800'}`}>
                {hasAccess ? (
                  <Lock className="w-5 h-5 text-green-400" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Room Access</p>
                <p className="text-sm text-gray-400">
                  {hasAccess 
                    ? "Your payment has been verified. You can now enter the private room." 
                    : "Complete the payment process to gain access to this exclusive room."
                  }
                </p>
              </div>
            </div>

            {/* Only show Payment Required section when user doesn't have access */}
            {!hasAccess && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">Payment Required</p>
                  <p className="text-sm text-gray-400">
                    One-time payment of <span className="text-blue-400 font-semibold">KES {room.price}</span> to gain permanent access.
                    Payment verification may take a few moments.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
          {hasAccess ? (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-900/20 to-emerald-900/20 flex items-center justify-center mx-auto mb-4">
                  <div className="w-14 h-14 rounded-full bg-green-900/30 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-green-400 mb-2">Welcome! 🎉</h3>
                <p className="text-gray-400">You have successfully gained access to this private room.</p>
              </div>
              <button
                onClick={() => navigate(`/privateroomchat/${id}`)}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-green-900/30"
              >
                Enter Room Chat
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-900/20 to-indigo-900/20 flex items-center justify-center mx-auto mb-4">
                  <div className="w-14 h-14 rounded-full bg-blue-900/30 flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Get Exclusive Access</h3>
                <p className="text-gray-400 mb-3">Pay once for lifetime access to this private room</p>
                <div className="inline-block px-6 py-3 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg border border-blue-500/20">
                  <p className="text-sm text-gray-400">Total Amount</p>
                  <p className="text-3xl font-bold text-blue-400">KES {room.price}</p>
                </div>
              </div>
              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-900/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {paying ? (
                  <span className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Redirecting to payment...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <CreditCard className="w-5 h-5" />
                    Tap to pay
                  </span>
                )}
              </button>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Secure payment • Encrypted connection</span>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                After payment, return to this page. Access will be automatically granted.
              </p>
            </div>
          )}
        </div>

        {/* Support Info */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/30 rounded-full">
            <span className="text-sm text-gray-500">Need help?</span>
            <button 
              onClick={() => navigate("/help")}
              className="text-blue-400 hover:text-blue-300 font-medium text-sm"
            >
              Contact Support
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Note: Payment verification may take up to 20 seconds after successful payment.
          </p>
        </div>
      </main>
    </div>
  );
}