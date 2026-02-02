import { serve } from "https://deno.land/std/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

serve(async (req) => {

  const body = await req.text()
  const signature = req.headers.get("x-paystack-signature")

  // verify signature
  const hash = await crypto.subtle.digest(
    "SHA-512",
    new TextEncoder().encode(body + Deno.env.get("PAYSTACK_SECRET_KEY"))
  )

  const expected = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")

  if (expected !== signature) {
    return new Response("Invalid signature", { status: 401 })
  }

  const event = JSON.parse(body)

  if (event.event === "charge.success") {

    const payment_ref = event.data.reference

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    await supabase
      .from("room_access")
      .update({ status: "paid" })
      .eq("payment_ref", payment_ref)
  }

  return new Response("ok")
})
