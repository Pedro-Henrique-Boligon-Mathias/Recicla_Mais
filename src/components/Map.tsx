"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

export default function MapWrapper({ ecopontos = [] }: { ecopontos?: any[] }) {
  useEffect(() => {
    console.log("Ecopontos recebidos:", ecopontos);
  }, [ecopontos]);

  return (
    <MapContainer
      center={[-27.3586, -53.3959]} // Frederico Westphalen - RS
      zoom={13}
      scrollWheelZoom
      style={{
        height: "100%",
        width: "100%",
        borderRadius: "1rem",
        zIndex: 0,
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {ecopontos.map((e) =>
        e.coords?.lat && e.coords?.lng ? (
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
        ) : null
      )}
    </MapContainer>
  );
}
