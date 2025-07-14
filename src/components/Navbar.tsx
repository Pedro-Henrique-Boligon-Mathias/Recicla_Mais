"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (user !== null) { // Só executa se user já foi inicializado
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
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-700/90 backdrop-blur-md rounded-full shadow-lg px-6 py-3 w-[95%] max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        {/* Logo e Links */}
        <div className="flex items-center gap-6">
          <Link 
            href="/" 
            className="text-xl font-bold text-white hover:opacity-80 transition-opacity"
          >
            ♻️ Recicla<span className="text-lime-300">+</span>
          </Link>
          <div className="hidden md:flex gap-2">
            <Link href="/" className={linkStyle("/")}>Início</Link>
            <Link href="/mapa" className={linkStyle("/mapa")}>Mapa</Link>
            <Link href="/calculadora" className={linkStyle("/calculadora")}>Calculadora</Link>
            <Link href="/marketplace" className={linkStyle("/marketplace")}>Marketplace</Link>
          </div>
        </div>

        {/* Área de Perfil / Auth */}
        <div className="flex items-center gap-4">
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
                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Trocar foto
                </span>
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
    </nav>
  );
}