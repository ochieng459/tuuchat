import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req) => {
  try {
    // ---------------- Handle CORS Preflight ----------------
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "tuuchat.netlify.app",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // ---------------- Only allow POST ----------------
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse request body
    const { user_id, room_id } = await req.json();
    if (!user_id || !room_id) {
      return new Response("Missing user_id or room_id", { status: 400 });
    }

    // Get room price
    const { data: room, error: roomError } = await supabase
      .from("private_rooms")
      .select("price")
      .eq("id", room_id)
      .single();

    if (roomError || !room) {
      return new Response("Room not found", { status: 404 });
    }

    // Generate temporary payment reference
    const paymentRef = crypto.randomUUID();

    // Insert pending payment record
    await supabase.from("room_access").insert({
      user_id,
      room_id,
      amount: room.price,
      payment_ref: paymentRef,
      status: "pending",
    });

    // Return payment details with CORS headers
    return new Response(JSON.stringify({
      payment_ref: paymentRef,
      amount: room.price,
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (err) {
    console.error("Payment init error:", err);
    return new Response("Internal Server Error", {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
