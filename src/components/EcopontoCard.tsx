"use client";

import { MapPin, Leaf } from "lucide-react";

export default function EcopontoCard({ ecoponto }: { ecoponto: any }) {
  const tipos = Array.isArray(ecoponto.tipos) 
    ? ecoponto.tipos 
    : typeof ecoponto.tipos === "string" 
      ? ecoponto.tipos.split(",").map((t: string) => t.trim())
      : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col h-full">
      <div className="h-48 w-full overflow-hidden relative">
        <img
          src={ecoponto.foto || "/default-ecoponto.jpg"}
          alt={ecoponto.nome}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/default-ecoponto.jpg";
          }}
        />
        <div className="absolute bottom-2 left-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs flex items-center">
          <MapPin size={14} className="mr-1" />
          {tipos.length > 0 ? tipos[0] : "Reciclagem"}
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold text-green-800 mb-1">{ecoponto.nome}</h3>
        <p className="text-sm text-green-600 mb-3 flex-1 line-clamp-3">
          {ecoponto.descricao || "Ponto de coleta seletiva de materiais recicláveis."}
        </p>
        
        <div className="flex flex-wrap gap-2 mt-auto">
          {tipos.slice(0, 3).map((tipo: string, idx: number) => (
            <span
              key={idx}
              className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center"
            >
              <Leaf size={12} className="mr-1" />
              {tipo}
            </span>
          ))}
          {tipos.length > 3 && (
            <span className="bg-green-50 text-green-600 text-xs px-2 py-1 rounded-full">
              +{tipos.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}