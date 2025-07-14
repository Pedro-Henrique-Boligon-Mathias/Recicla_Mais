"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Leaf, MapPin, Filter, X, ShoppingBag } from "lucide-react";
import EcopontoCard from "@/components/EcopontoCard";

const MapWrapper = dynamic(() => import("@/components/Map"), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-green-100 rounded-xl flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600"></div>
    </div>
  )
});

export default function MapaPage() {
  const [ecopontos, setEcopontos] = useState<any[]>([]);
  const [filtros, setFiltros] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const tiposDisponiveis = [
    "Vidro", "Papel", "Metal", "Plástico", "Orgânico",
    "Eletrônicos", "Pilha", "Óleo", "Papelão"
  ];

  useEffect(() => {
    async function carregarEcopontos() {
      const { data, error } = await supabase.from("ecopontos").select("*");
      if (error) {
        console.error("Erro ao buscar ecopontos:", error);
      } else {
        setEcopontos(
          (data || []).map((e) => ({
            id: e.id,
            nome: e.nome,
            descricao: e.descricao,
            foto: e.foto,
            coords: { lat: e.lat, lng: e.lng },
            tipos: Array.isArray(e.tipo) ? e.tipo : [e.tipo],
          }))
        );
      }
      setLoading(false);
    }
    carregarEcopontos();
  }, []);

  const ecopontosFiltrados = filtros.length
    ? ecopontos.filter((e) =>
        e.tipos.some((tipo: string) => filtros.includes(tipo))
      )
    : ecopontos;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header do Marketplace */}
      <header className="bg-gradient-to-r from-green-600 to-emerald-700 text-white pb-12 pt-24 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center">
            <MapPin className="w-10 h-10 mr-3" />
            Mapa de Ecopontos
          </h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            Encontre pontos de coleta seletiva e reciclagem perto de você
          </p>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Filtros e busca */}
        <section className="mb-6 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-600" /> 
                Locais de coleta
              </h2>
              <p className="text-gray-600 mt-1 text-sm">
                Filtre por tipo de material reciclável
              </p>
            </div>

            {/* Botão de filtros para mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-full text-sm"
            >
              <Filter size={16} />
              {filtros.length > 0 && (
                <span className="bg-white text-green-600 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {filtros.length}
                </span>
              )}
            </button>
          </div>

          {/* Filtros - versão desktop */}
          <div className="hidden md:flex flex-wrap gap-2 mt-4">
            {tiposDisponiveis.map((tipo) => (
              <button
                key={tipo}
                onClick={() =>
                  setFiltros((curr) =>
                    curr.includes(tipo)
                      ? curr.filter((x) => x !== tipo)
                      : [...curr, tipo]
                  )
                }
                className={`px-3 py-1 rounded-full border text-sm font-medium transition ${
                  filtros.includes(tipo)
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-800 border-gray-300 hover:bg-green-100"
                }`}
              >
                {tipo}
              </button>
            ))}
            {filtros.length > 0 && (
              <button
                onClick={() => setFiltros([])}
                className="px-3 py-1 rounded-full border border-red-300 bg-red-50 text-red-600 text-sm hover:bg-red-100 flex items-center gap-1"
              >
                <X size={16} /> Limpar
              </button>
            )}
          </div>

          {/* Filtros - versão mobile */}
          {showFilters && (
            <div className="md:hidden mt-4 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-800">Filtrar por tipo</h3>
                <button onClick={() => setShowFilters(false)}>
                  <X className="text-gray-600" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {tiposDisponiveis.map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() =>
                      setFiltros((curr) =>
                        curr.includes(tipo)
                          ? curr.filter((x) => x !== tipo)
                          : [...curr, tipo]
                      )
                    }
                    className={`px-3 py-2 rounded-lg border text-sm font-medium text-left transition ${
                      filtros.includes(tipo)
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
              {filtros.length > 0 && (
                <button
                  onClick={() => setFiltros([])}
                  className="w-full mt-3 px-3 py-2 rounded-lg border border-red-300 bg-red-50 text-red-600 text-sm hover:bg-red-100 flex items-center justify-center gap-1"
                >
                  <X size={16} /> Limpar filtros
                </button>
              )}
            </div>
          )}
        </section>

        {/* Mapa */}
        <section className="mb-8">
          <div className="w-full h-[400px] md:h-[500px] rounded-xl shadow-md overflow-hidden border border-gray-200">
            <MapWrapper ecopontos={ecopontosFiltrados} />
          </div>
        </section>

        {/* Resultados */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {filtros.length > 0
                ? `Ecopontos para ${filtros.join(", ")}`
                : "Todos os ecopontos"}
            </h2>
            <span className="text-sm text-gray-600">
              {ecopontosFiltrados.length} {ecopontosFiltrados.length === 1 ? "local" : "locais"}
            </span>
          </div>

          {/* Grid de cards */}
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : ecopontosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {ecopontosFiltrados.map((e) => (
                <EcopontoCard key={e.id} ecoponto={e} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
              <MapPin className="mx-auto text-gray-400 w-12 h-12 mb-3" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Nenhum ecoponto encontrado
              </h3>
              <p className="text-gray-600">
                {filtros.length > 0
                  ? "Tente ajustar os filtros de busca"
                  : "Não há ecopontos cadastrados na sua região"}
              </p>
            </div>
          )}
        </section>

        {/* Seção informativa */}
        <section className="bg-gray-100 rounded-xl p-6 md:p-8 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Leaf className="text-green-600" /> Benefícios da reciclagem
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Impacto ambiental</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span> Reduz a poluição do solo e da água
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span> Diminui o volume de lixo em aterros
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span> Economiza recursos naturais
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Como contribuir</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span> Separe os materiais corretamente
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span> Limpe os recicláveis antes de descartar
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span> Compartilhe locais com a comunidade
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* Footer do Marketplace */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold flex items-center">
                <Leaf className="w-5 h-5 mr-2 text-green-400" />
                Mapa de Ecopontos
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