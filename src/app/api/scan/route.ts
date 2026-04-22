import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createClient } from "@supabase/supabase-js";
import { biomechanicGraph } from "@/lib/agents/biomechanic-graph";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.user_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { paths } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    });

    // Get Profile Data
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user_id).single();

    // Transform signed URLs to base64 inline encoded data to prevent Gemini HTTP raw URL crashes
    const imageUrls: any = {};
    const downloadPromises = Object.keys(paths).map(async (key) => {
      const { data } = await supabase.storage.from("user-photos").createSignedUrl(paths[key], 3600);
      if (data?.signedUrl) {
        try {
          const imgReq = await fetch(data.signedUrl);
          const arrayBuffer = await imgReq.arrayBuffer();
          const base64String = Buffer.from(arrayBuffer).toString("base64");
          const typeMatch = data.signedUrl.match(/\.([^.?]+)(\?|$)/);
          const ext = typeMatch ? typeMatch[1].toLowerCase() : 'jpeg';
          const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
          imageUrls[key] = `data:${mimeType};base64,${base64String}`;
        } catch (e) {
          console.error("Failed to download image to base64 for key", key, e);
        }
      }
    });
    
    // Baixa as 4 imagens simultaneamente para não estourar os 10s da Vercel!
    await Promise.all(downloadPromises);

    // Run the LangGraph Brain
    const initialState = {
      userId: session.user_id,
      imageUrls,
      profileData: {
        age: prof?.age || 30,
        weight: prof?.weight_kg || 75,
        target: prof?.goal_weight || 70,
      }
    };

    const finalState = await biomechanicGraph.invoke(initialState);

    const diagnostico = finalState.diagnostico;
    const protocolos = finalState.protocolos;
    const cardioProtocol = finalState.cardioProtocol;

    if (diagnostico) {
      await supabase.from("diagnosticos").upsert({
        user_id: session.user_id,
        image_url: imageUrls.frente || "",
        cifose_grau: diagnostico.cifose_grau,
        escoliose_desvio: diagnostico.escoliose_desvio,
        metadata: { ...diagnostico, protocolos, cardioProtocol }
      }, { onConflict: 'user_id' });
    }

    return NextResponse.json({ ok: true, diagnostico, protocolos, cardioProtocol });

  } catch (err: any) {
    console.error("AI Agent Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
