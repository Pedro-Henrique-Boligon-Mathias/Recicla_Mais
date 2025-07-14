"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Award, ArrowRight } from "lucide-react";
import Link from "next/link";

type RankingItem = {
  user_id: string;
  nome: string;
  location: string;
  total_score: number;
  total_respostas: number;
};

export default function RankingSection() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarRanking() {
      try {
        // Primeiro buscamos as respostas para calcular os pontos
        const { data: respostasData, error: respostasError } = await supabase
          .from("respostas")
          .select("user_id, pontuacao");

        if (respostasError) throw respostasError;

        // Agora buscamos os dados dos usuários
        const { data: usuariosData, error: usuariosError } = await supabase
          .from("usuarios")
          .select("id, nome, location");

        if (usuariosError) throw usuariosError;

        // Calculamos os pontos por usuário
        const agrupado: Record<string, { total_score: number; total_respostas: number }> = {};

        respostasData.forEach(({ user_id, pontuacao }) => {
          if (!agrupado[user_id]) {
            agrupado[user_id] = { total_score: 0, total_respostas: 0 };
          }
          agrupado[user_id].total_score += pontuacao;
          agrupado[user_id].total_respostas += 1;
        });

        // Combinamos com os dados dos usuários
        const rankingArr = Object.entries(agrupado)
          .map(([user_id, stats]) => {
            const usuario = usuariosData.find(u => u.id === user_id);
            return {
              user_id,
              nome: usuario?.nome || "Anônimo",
              location: usuario?.location || "Local desconhecido",
              total_score: stats.total_score,
              total_respostas: stats.total_respostas,
            };
          })
          .sort((a, b) => b.total_score - a.total_score)
          .slice(0, 5); // Mostrar apenas os top 5 na página inicial

        setRanking(rankingArr);
      } catch (error) {
        console.error("Erro carregando ranking:", error);
      } finally {
        setLoading(false);
      }
    }

    carregarRanking();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="bg-green-100 p-2 rounded-lg mr-4">
            <Award className="w-6 h-6 text-green-700" />
          </div>
          <h2 className="text-2xl font-semibold text-green-800">Ranking Sustentável</h2>
        </div>
        <Link href="/calculadora" className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center">
          Ver completo <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
      
      <p className="text-gray-700 mb-6">
        Veja quem está contribuindo mais para um futuro sustentável na nossa comunidade.
      </p>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : ranking.length === 0 ? (
        <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
          <div className="mb-4">
            <Award className="w-12 h-12 text-green-400 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-green-800 mb-2">
            O ranking está vazio
          </h3>
          <p className="text-green-600">
            Participe do questionário para aparecer no ranking!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ranking.map((user, index) => (
            <div 
              key={user.user_id} 
              className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200"
            >
              <div className="flex items-center">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  index === 0 ? 'bg-amber-100 text-amber-800' : 
                  index === 1 ? 'bg-gray-100 text-gray-800' : 
                  index === 2 ? 'bg-amber-800 text-white' : 'bg-white text-gray-800 border'
                }`}>
                  {index + 1}
                </span>
                <div>
                  <h4 className="font-medium text-green-800">{user.nome}</h4>
                  <p className="text-xs text-green-600">{user.location}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-green-700">{user.total_score} pts</span>
                <p className="text-xs text-green-500">{user.total_respostas} respostas</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}