"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Leaf, Trees, Recycle, CloudRain, Sun, Bike, Bus, Car, Footprints, Award, History, User, ShoppingBag } from "lucide-react";

type Pergunta = {
  id: number;
  texto: string;
  opcoes: Record<string, number>;
};

type Resposta = {
  id: number;
  pergunta_id: number;
  resposta: string;
  pontuacao: number;
  created_at: string;
  user_id: string;
};

type RankingItem = {
  user_id: string;
  nome: string;
  location: string;
  total_score: number;
  total_respostas: number;
};

export default function CalculadoraPage() {
  const [usuario, setUsuario] = useState<any>(null);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [historico, setHistorico] = useState<{ created_at: string; score: number }[]>([]);
  const [activeTab, setActiveTab] = useState<"quiz" | "ranking" | "historico">("quiz");

  // Autenticação
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user);
    });
  }, []);

  // Carrega perguntas e ranking/histórico depois que usuário estiver disponível
  useEffect(() => {
    if (usuario) {
      carregarPerguntas();
      carregarRanking();
      carregarHistorico();
    }
  }, [usuario]);
  
  async function carregarPerguntas() {
    setErro(null);
    try {
      const { data: todasPerguntas, error: errorPerguntas } = await supabase
        .from("perguntas")
        .select("*")
        .order("id", { ascending: true });
  
      if (errorPerguntas) throw errorPerguntas;
  
      if (!usuario) {
        setPerguntas(todasPerguntas.slice(0, 2));
        return;
      }
  
      const { data: respondidas, error: errorRespostas } = await supabase
        .from("respostas")
        .select("pergunta_id")
        .eq("user_id", usuario.id);
  
      if (errorRespostas) throw errorRespostas;
  
      const idsRespondidas = respondidas.map((r) => r.pergunta_id);
      const perguntasNaoRespondidas = todasPerguntas.filter(
        (p) => !idsRespondidas.includes(p.id)
      );
  
      setPerguntas(perguntasNaoRespondidas.slice(0, 2));
    } catch (error) {
      console.error("Erro ao carregar perguntas:", error);
      setErro("Erro ao carregar perguntas.");
    }
  }

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
        .slice(0, 10);

      setRanking(rankingArr);
    } catch (error) {
      console.error("Erro carregando ranking:", error);
    }
  }

  async function carregarHistorico() {
    if (!usuario) return;

    try {
      const { data, error } = await supabase
        .from("respostas")
        .select("created_at, pontuacao")
        .eq("user_id", usuario.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const agrupado: Record<string, number> = {};
      (data as Resposta[]).forEach(({ created_at, pontuacao }) => {
        const dia = created_at.slice(0, 10);
        agrupado[dia] = (agrupado[dia] || 0) + pontuacao;
      });

      const histArr = Object.entries(agrupado).map(([dia, score]) => ({
        created_at: dia,
        score,
      }));

      histArr.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

      setHistorico(histArr);
    } catch (error) {
      console.error("Erro carregando histórico:", error);
    }
  }

  function handleRespostaChange(
    perguntaId: number,
    resposta: string,
    opcoes: Record<string, number>
  ) {
    setRespostas((old) => ({ ...old, [perguntaId]: resposta }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!usuario) {
      setErro("Você precisa estar logado para enviar respostas.");
      return;
    }

    setSalvando(true);

    try {
      for (const pergunta of perguntas) {
        const resp = respostas[pergunta.id];
        if (!resp) continue;

        const pontuacao = pergunta.opcoes[resp] ?? 0;

        const { error } = await supabase.from("respostas").insert({
          user_id: usuario.id,
          pergunta_id: pergunta.id,
          resposta: resp,
          pontuacao,
        });

        if (error) throw error;
      }

      setRespostas({});
      await carregarRanking();
      await carregarHistorico();
      await carregarPerguntas();
    } catch {
      setErro("Erro ao salvar respostas.");
    }

    setSalvando(false);
  }

  const renderIconForQuestion = (text: string) => {
    if (text.includes("transporte")) return <Bus className="w-5 h-5" />;
    if (text.includes("carne") || text.includes("alimento")) return <Leaf className="w-5 h-5" />;
    if (text.includes("energia")) return <Sun className="w-5 h-5" />;
    if (text.includes("água")) return <CloudRain className="w-5 h-5" />;
    if (text.includes("reciclagem")) return <Recycle className="w-5 h-5" />;
    return <Trees className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header do Marketplace */}
      <header className="bg-gradient-to-r from-green-600 to-emerald-700 text-white pb-12 pt-24 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center">
            <Leaf className="w-10 h-10 mr-3" />
            Calculadora de Pegada Ecológica
          </h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            Descubra seu impacto no meio ambiente e como você pode contribuir para um planeta mais sustentável
          </p>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Barra de navegação */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-full shadow-sm flex p-1 border border-emerald-100">
            <button
              onClick={() => setActiveTab("quiz")}
              className={`px-6 py-2 rounded-full flex items-center transition ${
                activeTab === "quiz"
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-800 hover:bg-emerald-50"
              }`}
            >
              <Leaf className="mr-2 w-4 h-4" />
              Questionário
            </button>
            <button
              onClick={() => setActiveTab("ranking")}
              className={`px-6 py-2 rounded-full flex items-center transition ${
                activeTab === "ranking"
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-800 hover:bg-emerald-50"
              }`}
            >
              <Award className="mr-2 w-4 h-4" />
              Ranking
            </button>
            <button
              onClick={() => setActiveTab("historico")}
              className={`px-6 py-2 rounded-full flex items-center transition ${
                activeTab === "historico"
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-800 hover:bg-emerald-50"
              }`}
            >
              <History className="mr-2 w-4 h-4" />
              Histórico
            </button>
          </div>
        </div>

        {/* Conteúdo da calculadora */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-green-100 mb-8">
          {activeTab === "quiz" && (
            <div className="p-6 md:p-8">
              <div className="flex items-center mb-6">
                <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                  <Leaf className="w-6 h-6 text-emerald-700" />
                </div>
                <h2 className="text-2xl font-bold text-emerald-900">
                  Seu Impacto no Planeta
                </h2>
              </div>
              
              <p className="text-emerald-700 mb-8">
                Responda algumas perguntas para descobrir como seus hábitos afetam o meio ambiente. 
                Cada resposta nos ajuda a criar um planeta mais verde para as futuras gerações.
              </p>

              {!usuario && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start">
                  <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                    <User className="w-5 h-5 text-yellow-700" />
                  </div>
                  <p className="text-yellow-700">
                    Você precisa estar logado para responder às perguntas e participar do ranking.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {perguntas.length === 0 && (
                  <div className="text-center py-12">
                    <div className="mb-4">
                      <Trees className="w-12 h-12 text-emerald-400 mx-auto" />
                    </div>
                    <h3 className="text-xl font-semibold text-emerald-800 mb-2">
                      Parabéns pela jornada sustentável!
                    </h3>
                    <p className="text-emerald-600 max-w-md mx-auto">
                      Você respondeu todas as perguntas disponíveis. Novas perguntas serão adicionadas em breve para continuarmos nossa missão verde.
                    </p>
                  </div>
                )}

                {perguntas.map((p) => (
                  <div 
                    key={p.id} 
                    className="mb-8 p-5 bg-emerald-50 rounded-xl border border-emerald-100"
                  >
                    <div className="flex items-start mb-4">
                      <div className="bg-emerald-100 p-2 rounded-lg mr-3 mt-1">
                        {renderIconForQuestion(p.texto)}
                      </div>
                      <h3 className="text-lg font-semibold text-emerald-900">
                        {p.texto}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(p.opcoes).map(([texto]) => (
                        <label 
                          key={texto}
                          className={`flex items-center p-4 rounded-lg border cursor-pointer transition ${
                            respostas[p.id] === texto
                              ? "bg-emerald-100 border-emerald-400"
                              : "bg-white border-emerald-100 hover:bg-emerald-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`pergunta-${p.id}`}
                            value={texto}
                            checked={respostas[p.id] === texto}
                            onChange={() => handleRespostaChange(p.id, texto, p.opcoes)}
                            disabled={!usuario || salvando}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border mr-3 flex-shrink-0 ${
                            respostas[p.id] === texto
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-emerald-300"
                          }`}>
                            {respostas[p.id] === texto && (
                              <div className="w-3 h-3 rounded-full bg-white m-auto"></div>
                            )}
                          </div>
                          <span className="text-emerald-800">{texto}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={salvando || !usuario || perguntas.length === 0}
                    className={`w-full py-3 rounded-xl font-medium transition ${
                      salvando || !usuario || perguntas.length === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
                    }`}
                  >
                    {salvando ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Salvando...
                      </span>
                    ) : (
                      "Salvar Respostas"
                    )}
                  </button>
                </div>

                {erro && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start">
                    <div className="bg-red-100 p-1.5 rounded mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p>{erro}</p>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Ranking */}
          {activeTab === "ranking" && (
            <div className="p-6 md:p-8">
              <div className="flex items-center mb-6">
                <div className="bg-amber-100 p-2 rounded-lg mr-3">
                  <Award className="w-6 h-6 text-amber-700" />
                </div>
                <h2 className="text-2xl font-bold text-emerald-900">
                  Ranking de Sustentabilidade
                </h2>
              </div>
              
              <p className="text-emerald-700 mb-8">
                Veja como você se compara a outros eco-cidadãos em nossa comunidade. 
                Cada ponto representa uma ação positiva pelo nosso planeta!
              </p>

              {usuario && (
                <div className="bg-emerald-100 rounded-lg p-4 mb-6 border border-emerald-200">
                  <h3 className="font-semibold text-emerald-800 mb-2">Sua posição</h3>
                  <p className="text-emerald-700">
                    {ranking.findIndex(item => item.user_id === usuario.id) >= 0 ? 
                      `Você está na posição #${ranking.findIndex(item => item.user_id === usuario.id) + 1} do ranking!` : 
                      "Responda mais perguntas para aparecer no ranking!"}
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {ranking.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <Trees className="w-12 h-12 text-emerald-400 mx-auto" />
                    </div>
                    <p className="text-emerald-600">
                      O ranking ainda está vazio. Seja o primeiro a responder as perguntas e assuma a liderança!
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Top 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      {ranking.slice(0, 3).map((item, idx) => (
                        <div 
                          key={item.user_id} 
                          className={`rounded-2xl p-5 text-center relative overflow-hidden ${
                            idx === 0 
                              ? "bg-gradient-to-b from-amber-100 to-yellow-100 border border-amber-200" 
                              : "bg-emerald-50 border border-emerald-100"
                          }`}
                        >
                          {idx === 0 && (
                            <div className="absolute top-0 right-0 bg-amber-500 text-white px-3 py-1 rounded-bl-lg text-sm font-bold">
                              Líder!
                            </div>
                          )}
                          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                              idx === 0 ? "bg-amber-200" : idx === 1 ? "bg-emerald-200" : "bg-cyan-200"
                            }`}>
                              <span className={`text-xl font-bold ${
                                idx === 0 ? "text-amber-700" : idx === 1 ? "text-emerald-700" : "text-cyan-700"
                              }`}>
                                #{idx + 1}
                              </span>
                            </div>
                          </div>
                          <div className="font-medium text-emerald-900 mb-1 truncate px-2">
                            {item.nome}
                          </div>
                          <div className="text-sm text-emerald-600 mb-2">
                            {item.location}
                          </div>
                          <div className="text-xl font-bold text-emerald-700">
                            {item.total_score} pts
                          </div>
                          <div className="text-sm text-emerald-500 mt-1">
                            {item.total_respostas} respostas
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Restante do ranking */}
                    <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                      <h3 className="font-semibold text-emerald-800 mb-4">Demais participantes</h3>
                      <ul className="space-y-3">
                        {ranking.slice(3).map((item, idx) => (
                          <li 
                            key={item.user_id} 
                            className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-emerald-100"
                          >
                            <div className="flex items-center">
                              <span className="w-8 text-center font-medium text-emerald-700">
                                #{idx + 4}
                              </span>
                              <div className="ml-3">
                                <div className="text-emerald-800 font-medium">{item.nome}</div>
                                <div className="text-xs text-emerald-600">{item.location}</div>
                              </div>
                            </div>
                            <div className="font-semibold text-emerald-700">
                              {item.total_score} pts
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Histórico */}
          {activeTab === "historico" && (
            <div className="p-6 md:p-8">
              <div className="flex items-center mb-6">
                <div className="bg-cyan-100 p-2 rounded-lg mr-3">
                  <History className="w-6 h-6 text-cyan-700" />
                </div>
                <h2 className="text-2xl font-bold text-emerald-900">
                  Sua Jornada Sustentável
                </h2>
              </div>
              
              <p className="text-emerald-700 mb-8">
                Acompanhe seu progresso ao longo do tempo. Cada pequena ação faz diferença na construção de um futuro mais verde.
              </p>

              {historico.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <Leaf className="w-12 h-12 text-emerald-400 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-emerald-800 mb-2">
                    Sua jornada verde está apenas começando!
                  </h3>
                  <p className="text-emerald-600 max-w-md mx-auto">
                    Responda às perguntas para começar a construir seu histórico de sustentabilidade.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-emerald-700">Pontos acumulados</span>
                      <span className="text-sm font-medium text-emerald-700">
                        Total: {historico.reduce((sum, item) => sum + item.score, 0)} pts
                      </span>
                    </div>
                    <div className="h-2 w-full bg-emerald-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        style={{ 
                          width: `${Math.min(100, (historico.reduce((sum, item) => sum + item.score, 0) / 300) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  <ul className="space-y-4">
                    {historico.map(({ created_at, score }) => (
                      <li 
                        key={created_at} 
                        className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-emerald-100"
                      >
                        <div className="flex items-center">
                          <div className="bg-emerald-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                            <Leaf className="w-5 h-5 text-emerald-700" />
                          </div>
                          <div>
                            <div className="font-medium text-emerald-900">
                              {new Date(created_at).toLocaleDateString('pt-BR', { 
                                weekday: 'long', 
                                day: 'numeric', 
                                month: 'long' 
                              })}
                            </div>
                            <div className="text-sm text-emerald-500">
                              {new Date(created_at).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="font-bold text-emerald-700 mr-2">{score}</span>
                          <span className="text-emerald-500">pts</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer do Marketplace */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold flex items-center">
                <Leaf className="w-5 h-5 mr-2 text-green-400" />
                Calculadora de Pegada Ecológica
              </h3>
              <p className="text-gray-400 text-sm mt-1">Parte do Projeto Destino Certo</p>
            </div>
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} - Feira de Ciências
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}