"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function CadastroPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [erro, setErro] = useState("");
  const router = useRouter();

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

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
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-green-50">
      <form
        onSubmit={handleCadastro}
        className="bg-white p-8 rounded-xl shadow-md space-y-4 w-full max-w-md"
      >
        <h1 className="text-2xl font-bold text-green-800 text-center">
          Criar Conta
        </h1>

        <div>
          <label className="block text-green-700 mb-1">Nome Completo *</label>
          <input
            type="text"
            placeholder="Seu nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-green-200"
            required
          />
        </div>

        <div>
          <label className="block text-green-700 mb-1">Email *</label>
          <input
            type="email"
            placeholder="seu@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-green-200"
            required
          />
        </div>

        <div>
          <label className="block text-green-700 mb-1">Senha (mínimo 6 caracteres) *</label>
          <input
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-green-200"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-green-700 mb-1">Telefone (com DDD) *</label>
          <input
            type="tel"
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-green-200"
            required
          />
        </div>

        <div>
          <label className="block text-green-700 mb-1">Cidade/Estado *</label>
          <input
            type="text"
            placeholder="Ex: São Paulo, SP"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-green-200"
            required
          />
        </div>

        {erro && (
          <p className="text-red-600 text-sm text-center py-2 bg-red-50 rounded">
            {erro}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-green-700 text-white py-2 rounded hover:bg-green-800 transition mt-4"
        >
          Cadastrar
        </button>

        <p className="text-center text-sm text-green-700 pt-2">
          Já tem conta?{" "}
          <a href="/login" className="underline hover:text-green-900">
            Entrar
          </a>
        </p>

        <p className="text-xs text-gray-500 text-center mt-4">
          Ao se cadastrar, você concorda com nossos Termos de Serviço e Política de Privacidade
        </p>
      </form>
    </main>
  );
}