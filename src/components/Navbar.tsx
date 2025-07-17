"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { Menu, X, QrCode } from "lucide-react";
import Image from "next/image";
import { Dialog } from '@headlessui/react';


export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Links de navegação
  const navLinks = [
    { href: "/", label: "Início" },
    { href: "/mapa", label: "Mapa" },
    { href: "/calculadora", label: "Calculadora" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/dicas", label: "Dicas" },
  ];

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Função para buscar dados do usuário
  const fetchUserData = async (currentUser: User | null) => {
    try {
      if (currentUser) {
        const { data, error } = await supabase
          .from("usuarios")
          .select("nome, foto_url")
          .eq("id", currentUser.id)
          .single();

        if (!error && data) {
          setUserName(data.nome || "Usuário");
          setFotoUrl(data.foto_url);
        } else {
          console.error("Erro ao buscar dados do usuário:", error);
          setUserName("Usuário");
          setFotoUrl(null);
        }
      } else {
        setUserName("");
        setFotoUrl(null);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do usuário:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Listener para eventos de autenticação e atualização
  useEffect(() => {
    let mounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const loadInitialData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
          await fetchUserData(session?.user ?? null);
        }
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        if (mounted) setIsLoading(false);
      }
    };

    const handleUserUpdate = async () => {
      if (mounted) {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      }
    };

    // Configurar listener de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          await fetchUserData(currentUser);
        }
      }
    );

    authSubscription = subscription;

    // Carregar dados iniciais
    loadInitialData();

    // Listener para eventos personalizados
    window.addEventListener('userUpdated', handleUserUpdate);

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  // Atualizar dados quando o user muda
  useEffect(() => {
    if (user !== null) {
      fetchUserData(user);
    }
  }, [user]);

  // Upload de foto de perfil
  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `fotos_perfil/${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("foto-perfil")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("foto-perfil")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from("usuarios")
        .update({ foto_url: publicUrl })
        .eq("id", user.id);

      if (dbError) throw dbError;

      setFotoUrl(publicUrl);
      window.dispatchEvent(new Event('userUpdated'));
    } catch (err) {
      console.error("Erro no upload da foto:", err);
      alert("Não foi possível atualizar sua foto de perfil.");
    } finally {
      setIsLoading(false);
    }
  }

  const linkStyle = (href: string) =>
    `px-4 py-1.5 rounded-full text-sm font-medium transition ${
      pathname === href
        ? "bg-white text-green-800"
        : "text-white/90 hover:bg-white/10"
    }`;

  if (isLoading) {
    return (
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-700/90 backdrop-blur-md rounded-full shadow-lg px-6 py-3 w-[95%] max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-xl font-bold text-white">♻️ Recicla<span className="text-lime-300">+</span></div>
            <div className="hidden md:flex gap-2">
              <div className="h-8 w-16 bg-white/20 rounded-full animate-pulse"></div>
              <div className="h-8 w-16 bg-white/20 rounded-full animate-pulse"></div>
              <div className="h-8 w-16 bg-white/20 rounded-full animate-pulse"></div>
              <div className="h-8 w-16 bg-white/20 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-8 w-20 bg-white/20 rounded-full animate-pulse"></div>
            <div className="h-8 w-24 bg-white/20 rounded-full animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Navbar Principal */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-700/90 backdrop-blur-md rounded-full shadow-lg px-6 py-3 w-[95%] max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo e Links (desktop) */}
          <div className="flex items-center gap-6">
            <Link 
              href="/" 
              className="text-xl font-bold text-white hover:opacity-80 transition-opacity"
            >
              ♻️ Recicla<span className="text-lime-300">+</span>
            </Link>
            <div className="hidden md:flex gap-2">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={linkStyle(link.href)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Botão Mobile */}
          <div className="flex items-center gap-4">
            {/* Botão QR Code */}
            <button
              onClick={() => setQrCodeOpen(true)}
              className="hidden md:flex items-center justify-center p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              title="Compartilhar via QR Code"
            >
              <QrCode size={20} />
            </button>

            <button 
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Área de Perfil / Auth */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <div className="relative group">
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt="Perfil"
                        className="w-8 h-8 rounded-full border-2 border-white cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => fileInputRef.current?.click()}
                        title="Clique para trocar a foto"
                      />
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-8 h-8 rounded-full bg-white text-green-700 flex items-center justify-center text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        {userName.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      ref={fileInputRef}
                      onChange={handleFotoChange}
                    />
                  </div>
                  <span className="text-sm text-white hidden sm:block truncate max-w-[120px]">
                    Olá, <strong>{userName}</strong>
                  </span>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      router.refresh();
                    }}
                    className="text-sm px-3 py-1 rounded-full bg-white text-green-800 hover:bg-gray-100 transition whitespace-nowrap"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`text-sm px-4 py-1 rounded-full transition whitespace-nowrap ${
                      pathname === "/login"
                        ? "bg-white/90 text-green-800"
                        : "bg-white text-green-800 hover:bg-gray-100"
                    }`}
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/cadastro"
                    className={`text-sm px-4 py-1 rounded-full border transition whitespace-nowrap ${
                      pathname === "/cadastro"
                        ? "bg-white/10 border-white text-white"
                        : "border-white text-white hover:bg-white/10"
                    }`}
                  >
                    Cadastrar
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modal do QR Code */}
      <Dialog
        open={qrCodeOpen}
        onClose={() => setQrCodeOpen(false)}
        className="relative z-50"
      >
        {/* Fundo escuro */}
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
                
        {/* Conteúdo do modal */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm rounded-xl bg-white p-6">
            <Dialog.Title className="text-xl font-bold text-green-800 mb-4">
              Compartilhe esta página
            </Dialog.Title>
                    
            <div className="flex flex-col items-center">
              <div className="mb-4 p-2 bg-white rounded-lg border border-gray-200">
                <img
                  src="/QRcode.jpg"
                  alt="QR Code da página"
                  className="w-full h-auto max-w-[200px]"
                  onError={(e) => {
                    console.error("Erro ao carregar QR Code", e);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
                
              <p className="text-sm text-gray-600 mb-4 text-center">
                Escaneie este QR Code para acessar esta página rapidamente
              </p>
                
              <button
                onClick={() => setQrCodeOpen(false)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Menu Mobile */}
      {mobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-green-700/95 backdrop-blur-md rounded-xl shadow-lg w-[90%] max-w-md py-4 px-6"
        >
          <div className="flex flex-col space-y-2">
            {/* Botão QR Code no mobile */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setQrCodeOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-white font-medium hover:bg-white/10"
            >
              <QrCode size={18} />
              Compartilhar via QR Code
            </button>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 rounded-lg text-white font-medium ${
                  pathname === link.href ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t border-white/20 pt-4 mt-2">
              {user ? (
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-3 px-4 py-2">
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt="Perfil"
                        className="w-10 h-10 rounded-full border-2 border-white"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white text-green-700 flex items-center justify-center text-sm font-semibold">
                        {userName.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    <span className="text-white">
                      Olá, <strong>{userName}</strong>
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      router.refresh();
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-3 rounded-lg bg-white text-green-800 font-medium text-center"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/login"
                    className={`px-4 py-3 rounded-lg text-center font-medium ${
                      pathname === "/login"
                        ? "bg-white/90 text-green-800"
                        : "bg-white text-green-800 hover:bg-gray-100"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/cadastro"
                    className={`px-4 py-3 rounded-lg border text-center font-medium ${
                      pathname === "/cadastro"
                        ? "bg-white/10 border-white text-white"
                        : "border-white text-white hover:bg-white/10"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Cadastrar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}