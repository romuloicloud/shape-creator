import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createClient } from "@supabase/supabase-js";
import { biomechanicGraph } from "@/lib/agents/biomechanic-graph";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.user_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { paths } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // Get Profile Data
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user_id).single();

    // Generate Signed URLs for the Gemini Vision
    const imageUrls: any = {};
    for (const key of Object.keys(paths)) {
      const { data } = await supabase.storage.from("user-photos").createSignedUrl(paths[key], 3600);
      if (data?.signedUrl) imageUrls[key] = data.signedUrl;
    }

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
      await supabase.from("diagnosticos").insert({
        user_id: session.user_id,
        image_url: imageUrls.frente || "",
        cifose_grau: diagnostico.cifose_grau,
        escoliose_desvio: diagnostico.escoliose_desvio,
        metadata: { ...diagnostico, protocolos, cardioProtocol }
      });
    }

    return NextResponse.json({ ok: true, diagnostico, protocolos, cardioProtocol });

  } catch (err: any) {
    console.error("AI Agent Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
