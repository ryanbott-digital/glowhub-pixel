import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function generateApiKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return "glw_" + Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate JWT from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceClient = createClient(supabaseUrl, serviceKey);
    const { action } = await req.json();

    if (action === "generate") {
      // Delete existing key for this user
      await serviceClient
        .from("user_api_keys")
        .delete()
        .eq("user_id", user.id);

      // Generate new key
      const rawKey = generateApiKey();
      const keyHash = await hashKey(rawKey);
      const keyPrefix = rawKey.substring(0, 12);

      const { error: insertError } = await serviceClient
        .from("user_api_keys")
        .insert({
          user_id: user.id,
          api_key_hash: keyHash,
          key_prefix: keyPrefix,
        });

      if (insertError) {
        return new Response(
          JSON.stringify({ error: "Failed to create API key" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Return the raw key ONLY on creation — it cannot be retrieved again
      return new Response(
        JSON.stringify({
          key: rawKey,
          prefix: keyPrefix,
          message: "Save this key — it will not be shown again.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "revoke") {
      await serviceClient
        .from("user_api_keys")
        .delete()
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ success: true, message: "API key revoked. All existing URLs are now invalid." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "status") {
      const { data: existing } = await serviceClient
        .from("user_api_keys")
        .select("key_prefix, created_at")
        .eq("user_id", user.id)
        .maybeSingle();

      return new Response(
        JSON.stringify({ hasKey: !!existing, prefix: existing?.key_prefix, created_at: existing?.created_at }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: generate, revoke, status" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
