"use client"

import { useState, useEffect } from "react"
import {
  Leaf, Recycle, Droplets, Trash2, Battery, GlassWater,
  Cpu, AlertTriangle, Info, ChevronDown, ChevronUp, Lightbulb, Sprout
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ReactNode } from "react"

type Fato = { id: number; icone: string; texto: string; fonte: string }
type Guia = { id: number; material: string; preparacao: string; reciclavel: string; nao_reciclavel: string; dica_especial: string }
type Passo = { id: number; passo: number; titulo: string; descricao: string; icone: string }
type Categoria = { id: number; nome: string; icone: string }
type Dica = { id: number; categoria_id: number; texto: string; extra: boolean }

const iconMap: Record<string, ReactNode> = {
  Trash2: <Trash2 size={20} />,
  Battery: <Battery size={20} />,
  GlassWater: <GlassWater size={20} />,
  Cpu: <Cpu size={20} />,
  Droplets: <Droplets size={20} />,
  AlertTriangle: <AlertTriangle size={20} />,
  Info: <Info size={20} />,
  Recycle: <Recycle size={20} />,
  Leaf: <Leaf size={20} />,
  Sprout: <Sprout size={20} />,
  Lightbulb: <Lightbulb size={20} />
}

export default function DicasPage() {
  const [facts, setFacts] = useState<Fato[]>([])
  const [guide, setGuide] = useState<Guia[]>([])
  const [steps, setSteps] = useState<Passo[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [openCategory, setOpenCategory] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: factsData } = await supabase.from('fatos_sustentabilidade').select('*')
    const { data: guideData } = await supabase.from('guia_reciclagem').select('*')
    const { data: stepsData } = await supabase.from('passos_descarte').select('*')
    const { data: categoriasData } = await supabase.from('categorias_dicas').select('*')
    const { data: dicasData } = await supabase.from('dicas').select('*')

    const categoriasComDicas = categoriasData?.map((cat) => ({
      ...cat,
      dicas: dicasData?.filter(d => d.categoria_id === cat.id && !d.extra),
      extra: dicasData?.find(d => d.categoria_id === cat.id && d.extra)?.texto || ''
    })) || []

    setFacts(factsData || [])
    setGuide(guideData || [])
    setSteps(stepsData || [])
    setCategories(categoriasComDicas)
  }

  return (
    <main className="bg-green-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-600 to-emerald-700 py-12 md:py-24 text-center text-white">
        <div className="container mx-auto px-4 mt-16 md:mt-20 relative z-10">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-4 md:mb-6">
            Guia Completo de Sustentabilidade
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto mb-6 md:mb-8">
            Aprenda a reciclar corretamente, reduzir seu impacto ambiental e transformar hábitos cotidianos
          </p>
        </div>
      </section>

      {/* Fatos Impactantes */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-green-800 mb-6 md:mb-8 text-center">
            <Lightbulb className="inline mr-2 text-amber-400" size={24} />
            Você Sabia?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {facts.map((fact) => (
              <div key={fact.id} className="bg-green-50 rounded-lg md:rounded-xl p-4 md:p-6 border border-green-200 hover:shadow-md transition-shadow">
                <div className="text-green-600 mb-2 md:mb-3">
                  {iconMap[fact.icone]}
                </div>
                <p className="text-base md:text-lg font-medium text-gray-800 mb-1 md:mb-2">{fact.texto}</p>
                <p className="text-xs md:text-sm text-gray-500">{fact.fonte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guia de Reciclagem */}
      <section className="py-8 md:py-12 bg-green-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-green-800 mb-6 md:mb-8 text-center">
            <Recycle className="inline mr-2" size={24} />
            Guia de Reciclagem
          </h2>
          <div className="overflow-x-auto">
            <div className="min-w-[600px] bg-white rounded-lg md:rounded-xl overflow-hidden shadow-md">
              <table className="w-full">
                <thead className="bg-green-100">
                  <tr>
                    <th className="py-3 px-4 md:py-4 md:px-6 text-left text-sm md:text-base">Material</th>
                    <th className="py-3 px-4 md:py-4 md:px-6 text-left text-sm md:text-base">Preparação</th>
                    <th className="py-3 px-4 md:py-4 md:px-6 text-left text-sm md:text-base">Reciclável</th>
                    <th className="py-3 px-4 md:py-4 md:px-6 text-left text-sm md:text-base">Não Reciclável</th>
                    <th className="py-3 px-4 md:py-4 md:px-6 text-left text-sm md:text-base">Dica Especial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {guide.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4 md:py-4 md:px-6 font-medium flex items-center gap-2 text-sm md:text-base">
                        {iconMap[item.material] || <Recycle size={18} />} {item.material}
                      </td>
                      <td className="py-3 px-4 md:py-4 md:px-6 text-sm md:text-base">{item.preparacao}</td>
                      <td className="py-3 px-4 md:py-4 md:px-6 text-sm md:text-base">{item.reciclavel}</td>
                      <td className="py-3 px-4 md:py-4 md:px-6 text-sm md:text-base">{item.nao_reciclavel}</td>
                      <td className="py-3 px-4 md:py-4 md:px-6 text-sm md:text-base">
                        <div className="bg-amber-50 border-l-4 border-amber-400 py-1 px-2 md:py-2 md:px-4 text-amber-700 text-xs md:text-sm">
                          {item.dica_especial}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Passos para descarte */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-green-800 mb-6 md:mb-8 text-center">
            <Info className="inline mr-2 text-blue-500" size={24} />
            4 Passos para o Descarte Perfeito
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
            {steps.map((step) => (
              <div key={step.id} className="border-2 border-dashed border-green-300 rounded-lg md:rounded-xl p-4 md:p-6 text-center hover:shadow-md transition">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  {iconMap[step.icone]}
                </div>
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-green-600 text-white flex items-center justify-center mx-auto mb-3 md:mb-4">
                  {step.passo}
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-green-800 mb-2 md:mb-3">{step.titulo}</h3>
                <p className="text-sm md:text-base text-gray-700">{step.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorias e dicas */}
      <section className="py-8 md:py-12 bg-green-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-green-800 mb-6 md:mb-8 text-center">
            <Sprout className="inline mr-2 text-lime-500" size={24} />
            Dicas Práticas por Categoria
          </h2>

          <div className="max-w-4xl mx-auto">
            {categories.map((categoria) => (
              <div key={categoria.id} className="bg-white rounded-lg md:rounded-xl shadow-sm mb-4 md:mb-6 overflow-hidden border border-green-200 hover:shadow-md transition">
                <button
                  className="w-full flex items-center justify-between p-4 md:p-6 text-left"
                  onClick={() => setOpenCategory(openCategory === categoria.id ? null : categoria.id)}
                >
                  <div className="flex items-center">
                    <div className="p-2 md:p-3 bg-green-100 rounded-lg md:rounded-xl mr-3 md:mr-4">
                      {iconMap[categoria.icone] || <Leaf size={20} />}
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-green-800">{categoria.nome}</h3>
                  </div>
                  {openCategory === categoria.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {openCategory === categoria.id && (
                  <div className="px-4 md:px-6 pb-4 md:pb-6">
                    <ul className="space-y-2 md:space-y-3 mb-3 md:mb-4">
                      {categoria.dicas.map((dica: any, index: number) => (
                        <li key={index} className="flex items-start gap-2 md:gap-3">
                          <div className="bg-green-100 p-1 rounded-full mt-0.5">
                            <Sprout className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                          </div>
                          <span className="text-sm md:text-base text-gray-700">{dica.texto}</span>
                        </li>
                      ))}
                    </ul>
                    {categoria.extra && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 md:p-4">
                        <p className="text-xs md:text-sm text-yellow-700">{categoria.extra}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 md:py-16 bg-gray-800 from-green-700 to-emerald-800 text-white text-center">
        <div className="container mx-auto px-4">
          <Lightbulb className="mx-auto mb-3 md:mb-4 text-yellow-300" size={36} />
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">
            Pequenas Ações, Grandes Impactos
          </h2>
          <p className="text-base md:text-xl max-w-2xl mx-auto mb-6 md:mb-8">
            Cada material reciclado corretamente economiza recursos naturais e energia. Suas escolhas diárias moldam o planeta!
          </p>
          <button className="bg-white text-green-700 font-semibold px-6 py-2 md:px-8 md:py-3 rounded-full hover:bg-gray-100 transition text-sm md:text-base">
            Baixe Nosso Guia Completo
          </button>
        </div>
      </section>
    </main>
  )
}