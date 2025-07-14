"use client";

import { useVisitorId } from "@/lib/useVisitorId";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Tracker() {
  const visitorId = useVisitorId();

  useEffect(() => {
    async function registrarAcesso() {
      if (!visitorId) return;

      try {
        // Buscar IP e localização
        const res = await fetch("https://ipinfo.io/json?token=c1c5fa020eb47f");
        const ipData = await res.json();

        const acesso = {
          visitor_id: visitorId,
          user_agent: navigator.userAgent,
          ip: ipData.ip,
          city: ipData.city,
          region: ipData.region,
          country: ipData.country,
          updated_at: new Date().toISOString(),
        };

        // Verificar se já existe
        const { data: existente, error } = await supabase
          .from("acessos")
          .select("visitor_id")
          .eq("visitor_id", visitorId)
          .single();

        if (existente) {
          // Atualiza o registro existente
          await supabase
            .from("acessos")
            .update(acesso)
            .eq("visitor_id", visitorId);
        } else {
          // Insere novo registro
          await supabase.from("acessos").insert(acesso);
        }
      } catch (error) {
        console.error("Erro ao registrar acesso:", error);
      }
    }

    registrarAcesso();
  }, [visitorId]);

  return null;
}
