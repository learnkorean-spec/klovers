import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64, pageImages } = await req.json();

    const hasPdfBase64 = typeof pdfBase64 === "string" && pdfBase64.length > 0;
    const safePageImages = Array.isArray(pageImages)
      ? pageImages.filter((img) => typeof img === "string" && img.startsWith("data:image/"))
      : [];

    if (!hasPdfBase64 && safePageImages.length === 0) {
      return new Response(JSON.stringify({ error: "pdfBase64 or pageImages is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userContent: Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }> = [
      {
        type: "text",
        text:
          "Extract all readable text from these CV pages. Preserve structure (sections, bullets, dates, contact details). Return plain text only.",
      },
    ];

    if (safePageImages.length > 0) {
      // Limit pages to keep payload/model context manageable
      for (const pageImage of safePageImages.slice(0, 6)) {
        userContent.push({
          type: "image_url",
          image_url: { url: pageImage },
        });
      }
    } else if (hasPdfBase64) {
      // Last-resort fallback for providers that may accept PDF data URLs
      userContent.push({
        type: "image_url",
        image_url: { url: `data:application/pdf;base64,${pdfBase64}` },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are an expert OCR system for resumes/CVs. Extract every readable character accurately. Preserve line breaks and logical grouping. Output only extracted text.",
          },
          {
            role: "user",
            content: userContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please top up your workspace usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error("AI text extraction failed");
    }

    const aiResult = await response.json();
    const extractedText = aiResult.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ text: extractedText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-pdf-text error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Text extraction failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
