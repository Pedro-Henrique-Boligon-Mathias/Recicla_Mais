import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api-inference.huggingface.co/models/seu-modelo", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: "Gere 5 perguntas relacionadas à pegada ecológica no formato JSON...",
      }),
    });

    if (!res.ok) {
      console.error("Erro na Hugging Face API:", await res.text());
      return NextResponse.json({ error: "Erro na API Hugging Face" }, { status: 500 });
    }

    const data = await res.json();

    // Transforme data para o formato esperado aqui, se necessário

    return NextResponse.json({ perguntas: data });
  } catch (error) {
    console.error("Erro na API /gerarPerguntas:", error);
    return NextResponse.json({ error: "Erro gerando perguntas" }, { status: 500 });
  }
}
