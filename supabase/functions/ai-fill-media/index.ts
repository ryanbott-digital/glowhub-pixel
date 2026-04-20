import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const BUCKET = "signage-content";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { media_id } = await req.json();
    if (!media_id || typeof media_id !== "string") {
      return new Response(JSON.stringify({ error: "media_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Fetch media + ownership
    const { data: media, error: mediaErr } = await admin
      .from("media")
      .select("*")
      .eq("id", media_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (mediaErr || !media) {
      return new Response(JSON.stringify({ error: "Media not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (media.type !== "image") {
      return new Response(JSON.stringify({ error: "Only images supported" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download original
    const { data: blob, error: dlErr } = await admin.storage.from(BUCKET).download(media.storage_path);
    if (dlErr || !blob) throw new Error("Failed to download original: " + dlErr?.message);
    const buf = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    const base64 = btoa(binary);
    const mimeType = blob.type || "image/png";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Call Lovable AI image edit
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extend this image outward to a 16:9 widescreen aspect ratio. Seamlessly continue the background, colours, lighting and atmosphere of the original image into the new edges. Keep ALL original content centered, untouched and at original size — only generate new pixels around it. The result should look like a natural widescreen version of the same scene with no visible seams.",
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const generatedUrl: string | undefined = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!generatedUrl || !generatedUrl.startsWith("data:")) {
      console.error("No image returned", JSON.stringify(aiData).slice(0, 500));
      return new Response(JSON.stringify({ error: "AI returned no image" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64
    const commaIdx = generatedUrl.indexOf(",");
    const meta = generatedUrl.slice(5, commaIdx); // image/png;base64
    const outMime = meta.split(";")[0] || "image/png";
    const b64 = generatedUrl.slice(commaIdx + 1);
    const binStr = atob(b64);
    const outBuf = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) outBuf[i] = binStr.charCodeAt(i);

    // Upload sibling
    const ext = outMime === "image/jpeg" ? "jpg" : "png";
    const baseName = media.storage_path.replace(/\.[^.]+$/, "");
    const newPath = `${baseName}_ai-fill-16x9.${ext}`;
    const { error: upErr } = await admin.storage.from(BUCKET).upload(newPath, outBuf, {
      contentType: outMime,
      upsert: true,
    });
    if (upErr) throw new Error("Upload failed: " + upErr.message);

    // Insert media row
    const newName = media.name.replace(/\.[^.]+$/, "") + " (AI Fill 16:9)";
    const { data: inserted, error: insErr } = await admin
      .from("media")
      .insert({
        user_id: userId,
        name: newName,
        storage_path: newPath,
        type: "image",
        folder_id: media.folder_id,
        aspect_ratio: "16:9",
        display_mode: "fill",
      })
      .select("id")
      .single();
    if (insErr || !inserted) throw new Error("DB insert failed: " + insErr?.message);

    return new Response(JSON.stringify({ media_id: inserted.id, storage_path: newPath }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-fill-media error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
