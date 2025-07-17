"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Leaf, UserRound, Mail, Lock, Phone, MapPin } from "lucide-react";


export default function CadastroPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    // Validação básica
    if (!email || !senha || !nome || !phone || !location) {
      return setErro("Preencha todos os campos obrigatórios");
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setErro("Por favor, insira um email válido");
    }

    // Validação de senha
    if (senha.length < 6) {
      return setErro("A senha deve ter pelo menos 6 caracteres");
    }

    try {
      // 1. Registrar o usuário no Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { 
            nome,
            phone,
            location 
          },
        },
      });

      if (signUpError) {
        return setErro(signUpError.message);
      }

      if (!signUpData || !signUpData.user) {
        return setErro("Não foi possível criar a conta. Tente novamente.");
      }

      // 2. Inserir no banco de dados
      const { error: dbError } = await supabase
        .from("usuarios")
        .insert([{ 
          id: signUpData.user.id, 
          nome,
          email,
          phone,
          location,
          foto_url: null
        }]);

      if (dbError) {
        // Tentar limpar o usuário criado no Auth se falhar no banco de dados
        await supabase.auth.admin.deleteUser(signUpData.user.id);
        return setErro("Erro ao criar perfil: " + dbError.message);
      }

      // 3. Fazer login automático
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (signInError) {
        console.error("Erro no login automático:", signInError);
        // Não retornar erro, apenas redirecionar para login
        router.push("/login");
        return;
      }

      // 4. Disparar evento para atualizar a Navbar em todas as abas
      window.dispatchEvent(new CustomEvent('userUpdated', {
        detail: { userId: signUpData.user.id }
      }));

      // 5. Redirecionar com pequeno delay para garantir sincronização
      setTimeout(() => {
        router.push("/calculadora");
      }, 300);

    } catch (err) {
      console.error("Erro no processo de cadastro:", err);
      setErro("Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.");
    }

    finally {
      setLoading(false);
    }
  }

  return (
 <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-2xl">
        {/* Seção ilustrativa */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-b from-emerald-600 to-teal-700 p-8 flex-col justify-center items-center text-white">
          <Leaf className="w-16 h-16 mb-6" strokeWidth={1.5} />
          <h2 className="text-3xl font-bold mb-4 text-center">Junte-se à comunidade sustentável</h2>
          <p className="text-center text-emerald-100 mb-8">
            Faça parte do movimento por um futuro mais verde e conecte-se com pessoas que compartilham seus valores
          </p>
          <div className="space-y-4 w-full max-w-xs">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/30 p-2 rounded-full">
                <MapPin className="w-5 h-5" />
              </div>
              <span>Encontre ecopontos próximos</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/30 p-2 rounded-full">
                <Leaf className="w-5 h-5" />
              </div>
              <span>Participe do ranking ecológico</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/30 p-2 rounded-full">
                <UserRound className="w-5 h-5" />
              </div>
              <span>Conecte-se com a comunidade</span>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="w-full md:w-1/2 bg-white p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-emerald-800 mb-2">Criar Conta</h1>
            <p className="text-gray-600">Preencha seus dados para começar</p>
          </div>

          <form onSubmit={handleCadastro} className="space-y-5">
            <div className="space-y-4">
              {/* Campo Nome */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <UserRound className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  required
                />
              </div>

              {/* Campo Email */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  required
                />
              </div>

              {/* Campo Senha */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  required
                  minLength={6}
                />
              </div>

              {/* Campo Telefone */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  required
                />
              </div>

              {/* Campo Localização */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Cidade, Estado"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  required
                />
              </div>
            </div>

            {erro && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-lg font-medium text-white transition-all ${
                loading
                  ? "bg-emerald-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Criando conta...
                </span>
              ) : (
                "Cadastrar"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Já tem uma conta?{" "}
            <a href="/login" className="font-medium text-emerald-600 hover:text-emerald-800 hover:underline">
              Faça login
            </a>
          </div>

          <p className="mt-8 text-xs text-gray-500 text-center">
            Ao se cadastrar, você concorda com nossos{" "}
            <a href="#" className="underline hover:text-gray-700">Termos de Serviço</a> e{" "}
            <a href="#" className="underline hover:text-gray-700">Política de Privacidade</a>
          </p>
        </div>
      </div>
    </main>
  );
}