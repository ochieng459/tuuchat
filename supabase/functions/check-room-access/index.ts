import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Use your Supabase URL & anon key
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  // 1️⃣ Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "tuuchat.netlify.app",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // 2️⃣ Parse body
  const { room_id } = await req.json();

  if (!room_id) {
    return new Response(JSON.stringify({ error: "Missing room_id" }), {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  // 3️⃣ Check if user has access
  // Example: assume you pass user_id in headers
  const user_id = req.headers.get("x-user-id");
  if (!user_id) {
    return new Response(JSON.stringify({ error: "Missing user_id header" }), {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const { data, error } = await supabase
    .from("room_payments")
    .select("id")
    .eq("room_id", room_id)
    .eq("user_id", user_id)
    .single();

  return new Response(JSON.stringify({ has_access: !!data }), {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
});
