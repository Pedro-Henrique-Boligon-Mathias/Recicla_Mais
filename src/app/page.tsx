// src/app/page.tsx
"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import RankingSection from "@/components/RankingSection";
import { ArrowRight, Calculator, Leaf, Link as LinkIcon, MapPin, ShoppingBag } from "lucide-react";
import Link from "next/link";

// Tipos para os dados
type Ecoponto = {
  id: string;
  nome: string;
  descricao: string;
  endereco: string;
  coords: {
    lat: number;
    lng: number;
  };
  tipos: string[];
  foto?: string;
};

type MarketplaceItem = {
  id: string;
  title: string;
  type: string;
  price?: number | string | null; 
  image_path?: string;
};

// Carregamento dinâmico do mapa
const MapWrapper = dynamic(() => import("@/components/Map"), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-gray-500">Carregando mapa...</div>
});

export default function Home() {
  const [ecopontos, setEcopontos] = useState<Ecoponto[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [loadingEcopontos, setLoadingEcopontos] = useState(true);
  const [loadingMarketplace, setLoadingMarketplace] = useState(true);

  // Carregar ecopontos
  useEffect(() => {
    async function carregarEcopontos() {
      try {
        const { data, error } = await supabase.from("ecopontos").select("*").limit(6);
        
        if (error) throw error;

        const ecopontosFormatados = (data || []).map(ecoponto => ({
          id: ecoponto.id,
          nome: ecoponto.nome || "Ecoponto",
          descricao: ecoponto.descricao || "",
          endereco: ecoponto.endereco || "Endereço não disponível",
          coords: {
            lat: ecoponto.lat || 0,
            lng: ecoponto.lng || 0
          },
          tipos: Array.isArray(ecoponto.tipo) ? ecoponto.tipo : [ecoponto.tipo || "Geral"],
          foto: ecoponto.foto || null
        }));
        
        setEcopontos(ecopontosFormatados);
      } catch (error) {
        console.error("Erro ao buscar ecopontos:", error);
        setEcopontos([]);
      } finally {
        setLoadingEcopontos(false);
      }
    }

    carregarEcopontos();
  }, []);

  // Carregar itens do marketplace
  useEffect(() => {
    async function carregarMarketplace() {
      try {
        const { data, error } = await supabase.from("marketplace_items").select("*").limit(4);
        
        if (error) throw error;
        
        setMarketplaceItems(data || []);
      } catch (error) {
        console.error("Erro ao buscar itens:", error);
        setMarketplaceItems([]);
      } finally {
        setLoadingMarketplace(false);
      }
    }

    carregarMarketplace();
  }, []);

  // Obter URL da imagem do marketplace
  const getImageUrl = (path: string) => {
    if (!path) return '/placeholder-item.jpg';
    const { data } = supabase.storage.from('marketplace-images').getPublicUrl(path);
    return data.publicUrl || '/placeholder-item.jpg';
  };

  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return 'R$ 0,00';
    
    // Converte string para número se necessário
    const numericPrice = typeof price === 'string' 
      ? parseFloat(price.replace(',', '.')) 
      : price;

    // Verifica se é um número válido
    if (isNaN(numericPrice as number)) return 'R$ 0,00';

    return `R$ ${numericPrice.toFixed(2).replace('.', ',')}`;
  };

  return (
    <main className="bg-green-50 min-h-screen text-gray-800 font-sans">
      {/* Banner */}
      <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-b-[60px] md:rounded-b-[80px] bg-green-800 shadow-lg">
        <Image
          src="/imagens/Banner.png"
          alt="Banner Destino Certo"
          fill
          className="object-cover object-center opacity-80"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 100vw"
        />
        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold drop-shadow-xl mb-4 px-4">
            Destino Certo: Conectando você a um futuro mais verde 🌿
          </h1>
          <p className="text-green-100 max-w-2xl text-base sm:text-lg md:text-xl">
            Encontre ecopontos, aprenda boas práticas e participe de uma comunidade que faz a diferença.
          </p>
        </div>
        <div className="absolute bottom-[-1px] w-full h-[40px] md:h-[60px] bg-[url('/imagens/folhagem.png')] bg-repeat-x bg-bottom" />
      </section>

      {/* Introdução */}
      <section className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-green-100">
          <h2 className="text-2xl md:text-3xl font-semibold text-green-700 mb-4">Por que reciclar?</h2>
          <p className="mb-4 text-base md:text-lg leading-relaxed">
            A reciclagem é uma das formas mais eficazes de combater os impactos ambientais da produção e do descarte inadequado de resíduos. Segundo o Ministério do Meio Ambiente, o Brasil produz mais de 82 milhões de toneladas de resíduos por ano, mas apenas 3% é reciclado corretamente.
          </p>
          <p className="mb-4 text-base md:text-lg">
            O projeto <strong className="text-green-700">Destino Certo</strong> tem como objetivo incentivar a prática da reciclagem e o consumo consciente, oferecendo ferramentas e informações práticas para a comunidade escolar e local.
          </p>
        </div>
      </section>

      {/* Cards de Funcionalidades */}
      <section className="bg-white py-12 md:py-16 rounded-t-[40px] md:rounded-t-[60px]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map(({ titulo, descricao, icone }) => (
            <div
              key={titulo}
              className="bg-green-50 rounded-xl shadow-sm hover:shadow-md p-5 hover:bg-green-100 transition-all duration-300 border border-green-200 hover:border-green-300"
            >
              <div className="text-3xl mb-3">{icone}</div>
              <h3 className="text-lg font-bold mb-2 text-green-800">{titulo}</h3>
              <p className="text-gray-700 text-sm leading-snug">{descricao}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Seção Mapa e Marketplace lado a lado */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Mapa de Ecopontos */}
        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 border border-green-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg mr-3 sm:mr-4">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-green-800">Mapa de Ecopontos</h2>
            </div>
            <Link href="/mapa" className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center group">
              Ver todos <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <p className="text-gray-700 mb-5 sm:mb-6">
            Encontre os locais mais próximos para descartar seus recicláveis corretamente.
          </p>
          
          <div className="w-full h-[250px] sm:h-[300px] rounded-lg overflow-hidden shadow-sm border border-gray-200">
            <MapWrapper ecopontos={ecopontos.filter(e => e.coords.lat && e.coords.lng)} />
          </div>
        </div>

        {/* Marketplace */}
        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 border border-green-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg mr-3 sm:mr-4">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-green-800">Marketplace</h2>
            </div>
            <Link href="/marketplace" className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center group">
              Ver todos <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <p className="text-gray-700 mb-5 sm:mb-6">
            Compre, venda ou troque itens sustentáveis com a comunidade.
          </p>
          
          {loadingMarketplace ? (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-[180px]"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {marketplaceItems.map((item) => (
                <Link 
                  key={item.id} 
                  href={`/marketplace/${item.id}`}
                  className="bg-white p-3 rounded-lg border border-green-100 hover:border-green-300 transition-all hover:shadow-sm group"
                >
                  <div className="bg-green-50 aspect-square rounded-md mb-2 overflow-hidden">
                    {item.image_path ? (
                      <img 
                        src={getImageUrl(item.image_path)} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-green-500">
                        <Leaf className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-green-800 truncate text-sm sm:text-base">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {item.type === 'produto' ? formatPrice(item.price) : 'Troca/Doação'}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Seção Calculadora e Ranking */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Calculadora de Pegada Ecológica */}
        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 border border-green-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg mr-3 sm:mr-4">
                <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-green-800">Pegada Ecológica</h2>
            </div>
            <Link href="/calculadora" className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center group">
              Calcular <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <p className="text-gray-700 mb-5 sm:mb-6">
            Descubra como suas escolhas impactam o meio ambiente e receba dicas personalizadas.
          </p>
          
          <div className="bg-green-50 rounded-lg p-5 sm:p-6 border-2 border-dashed border-green-200 text-center hover:border-green-300 transition">
            <div className="flex justify-center mb-3 sm:mb-4">
              <Leaf className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-green-800 mb-2">Descubra seu impacto</h3>
            <p className="text-green-600 mb-3 sm:mb-4 text-sm sm:text-base">Responda nosso questionário rápido e receba seu resultado</p>
            <Link 
              href="/calculadora" 
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-5 py-2 sm:px-6 sm:py-2 rounded-lg font-medium transition-colors"
            >
              Iniciar cálculo
            </Link>
          </div>
        </div>

        {/* Ranking Sustentável */}
        <RankingSection/>
      </section>

      {/* Rodapé */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg sm:text-xl font-bold flex items-center">
                <Leaf className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-400" />
                Destino Certo
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">Feira de Ciências 2024</p>
            </div>
            <div className="text-gray-400 text-xs sm:text-sm">
              © {new Date().getFullYear()} - Todos os direitos reservados
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

const features = [
  {
    titulo: "Mapa de Ecopontos",
    descricao: "Encontre locais próximos para descartar recicláveis corretamente.",
    icone: "🗺️",
  },
  {
    titulo: "Dicas Sustentáveis",
    descricao: "Aprenda hábitos simples que reduzem seu impacto ambiental.",
    icone: "💡",
  },
  {
    titulo: "Ranking Sustentável",
    descricao: "Ganhe pontos por atitudes verdes e suba no ranking!",
    icone: "🏆",
  },
  {
    titulo: "Marketplace",
    descricao: "Compre ou troque produtos ecológicos com a comunidade.",
    icone: "🛍️",
  },
];