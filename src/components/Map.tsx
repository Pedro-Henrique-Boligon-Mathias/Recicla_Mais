"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Corrige o problema dos ícones padrão
const DefaultIcon = L.icon({
  iconUrl: '/images/leaflet/marker-icon.png',
  iconRetinaUrl: '/images/leaflet/marker-icon-2x.png',
  shadowUrl: '/images/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MapWrapper({ ecopontos = [] }: { ecopontos?: any[] }) {
  useEffect(() => {
    // Configura o ícone padrão
    L.Marker.prototype.options.icon = DefaultIcon;
  }, []);

  return (
    <MapContainer
      center={[-29.68, -53.81]}
      zoom={13}
      scrollWheelZoom
      style={{ 
        height: "100%", 
        width: "100%", 
        borderRadius: "1rem",
        zIndex: 0
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {ecopontos.map((e) => (
        <Marker key={e.id} position={[e.coords.lat, e.coords.lng]}>
          <Popup className="leaflet-popup">
            <div className="max-w-[200px]">
              <h3 className="font-semibold text-green-800 text-sm sm:text-base">{e.nome}</h3>
              {e.foto && (
                <img
                  src={e.foto}
                  alt={e.nome}
                  className="w-full h-28 object-cover rounded-md my-2"
                  loading="lazy"
                />
              )}
              {e.descricao && (
                <p className="text-xs sm:text-sm text-green-700 mb-1">{e.descricao}</p>
              )}
              <strong className="text-green-900 text-xs sm:text-sm">Materiais aceitos:</strong>
              <ul className="list-disc list-inside text-green-800 text-xs sm:text-sm">
                {e.tipos?.map((tipo: string) => (
                  <li key={tipo}>{tipo}</li>
                ))}
              </ul>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}