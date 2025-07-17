// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientOnly from "@/components/ClientOnly";
import { UserProvider } from "./context/UserContext";
import Navbar from "@/components/Navbar";
import Tracker from "@/components/Tracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recicla +",
  description:
    "Aplicativo para escolhas sustentáveis com mapa de ecopontos, calculadora ecológica e mais.",
  icons: {
    icon: "/eco-favicon.ico", // nome do arquivo que você salvou
    shortcut: "/eco-favicon.ico",
    apple: "/eco-icon.png",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/eco-icon.png",
    },
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="bg-green-50">
      <head>
        {/* Adicionado para garantir que o favicon seja carregado corretamente */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-gray-900 bg-green-50`}
      >
        <ClientOnly>
          <UserProvider>
            <Navbar />
            <Tracker /> {/* ✅ Registro de acesso rodando por baixo dos panos */}
          </UserProvider>
        </ClientOnly>

        <div>{children}</div>
      </body>
    </html>
  );
}