"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Mail, Lock, Leaf } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password: senha 
      });

      if (error) {
        setErro("Credenciais inválidas. Verifique seu email e senha.");
        return;
      }
      
      router.push("/calculadora");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Cabeçalho decorativo */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-center text-white">
          <div className="flex justify-center mb-3">
            <Leaf className="w-10 h-10" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
          <p className="text-emerald-100 mt-1">Acesse sua conta para continuar sua jornada sustentável</p>
        </div>

        {/* Formulário */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Campo Email */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Email</label>
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
            </div>

            {/* Campo Senha */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Senha</label>
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
                />
              </div>
              <div className="flex justify-end">
                <a href="/recuperar-senha" className="text-xs text-emerald-600 hover:underline">
                  Esqueceu sua senha?
                </a>
              </div>
            </div>

            {/* Mensagem de erro */}
            {erro && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {erro}
              </div>
            )}

            {/* Botão de login */}
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
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </button>

            {/* Divisor */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-2 bg-white text-gray-500">ou</span>
              </div>
            </div>

            {/* Link para cadastro */}
            <p className="text-center text-sm text-gray-600">
              Não tem uma conta?{" "}
              <a href="/cadastro" className="font-medium text-emerald-600 hover:text-emerald-800 hover:underline">
                Cadastre-se
              </a>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}