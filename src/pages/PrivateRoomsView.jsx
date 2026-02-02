import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase"; // fixed import

export default function PrivateRoomsView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRoom();
  }, [id]);

  async function loadRoom() {
    try {
      setLoading(true);
      setError(null);

      // Fetch room with creator info
      const { data, error } = await supabase
        .from("private_rooms")
        .select(`
          id,
          name,
          description,
          price,
          image_url,
          profiles:created_by (
            username,
            avatar_url
          )
        `)
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Room not found");
        setLoading(false);
        return;
      }

      setRoom(data);

      // Check access
      const { data: accessData, error: accessError } = await supabase.functions.invoke(
        "check-room-access",
        { body: { room_id: id } }
      );

      if (accessError) console.error("Access check error:", accessError);

      setHasAccess(accessData?.has_access === true);
      setLoading(false);

    } catch (err) {
      console.error(err);
      setError("Failed to load room");
      setLoading(false);
    }
  }

  async function handlePay() {
    try {
      setPaying(true);

      // create payment record
      await supabase.functions.invoke("create-room-payment", {
        body: { room_id: id }
      });

      // init paystack
      const { data, error } = await supabase.functions.invoke("init-paystack-payment", {
        body: { room_id: id }
      });

      if (error) {
        console.error("Payment init error:", error);
        setPaying(false);
        return;
      }

      if (!data?.checkout_url) {
        console.error("No checkout_url returned", data);
        setPaying(false);
        return;
      }

      // redirect to Paystack checkout
      window.location.href = data.checkout_url;

    } catch (err) {
      console.error(err);
      setPaying(false);
    }
  }

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!room) return <div className="text-center py-10">Room not found</div>;

  return (
    <div className="max-w-md mx-auto p-4">

      <img
        src={room.image_url || "/room-default.png"}
        className="w-full h-48 object-cover rounded-xl"
        alt={room.name}
      />

      <h1 className="text-2xl font-bold mt-3">{room.name}</h1>

      <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
        <img
          src={room.profiles?.avatar_url || "/user-default.png"}
          alt={room.profiles?.username || "Admin"}
          className="w-6 h-6 rounded-full"
        />
        Admin: {room.profiles?.username || "Unknown"}
      </div>

      <p className="mt-3 text-gray-300">{room.description}</p>

      <div className="mt-4 font-semibold text-gray-100">
        Entry Price: {room.price} KES
      </div>

      {hasAccess ? (
        <button
          className="w-full mt-5 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition"
          onClick={() => navigate(`/room/${id}`)}
        >
          Enter Room
        </button>
      ) : (
        <button
          className="w-full mt-5 bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 transition"
          disabled={paying}
          onClick={handlePay}
        >
          {paying ? "Redirecting..." : "Pay to Enter"}
        </button>
      )}

    </div>
  );
}
