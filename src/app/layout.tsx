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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="bg-green-50">
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
