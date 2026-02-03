import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req) => {
  // 1️⃣ Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "https://tuuchat.netlify.app",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // 2️⃣ Initialize Supabase client
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // 3️⃣ Parse request body
    const { user_id, room_id } = await req.json();

    if (!user_id || !room_id) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or room_id" }),
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // 4️⃣ Get room price
    const { data: room, error } = await supabase
      .from("private_rooms")
      .select("price")
      .eq("id", room_id)
      .single();

    if (error || !room) {
      return new Response(
        JSON.stringify({ error: "Room not found" }),
        {
          status: 404,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // 5️⃣ Generate payment reference
    const paymentRef = crypto.randomUUID();

    // 6️⃣ Insert pending payment
    await supabase.from("room_access").insert({
      user_id,
      room_id,
      amount: room.price,
      payment_ref: paymentRef,
      status: "pending",
    });

    // 7️⃣ Return payment details
    return new Response(
      JSON.stringify({ payment_ref: paymentRef, amount: room.price }),
      {
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Server error", details: err.message }),
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
});
