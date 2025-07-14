"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) return setErro("Credenciais inválidas.");
    
    
    if (!error) {
      router.push("/calculadora");
      router.refresh();  
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-green-50">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-md space-y-4 w-full max-w-md"
      >
        <h1 className="text-xl font-bold text-green-800 text-center">Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
        {erro && <p className="text-red-500 text-sm">{erro}</p>}
        <button className="w-full bg-green-700 text-white py-2 rounded hover:bg-green-800">
          Entrar
        </button>
        <p className="text-center text-sm text-green-700">
          Não tem conta? <a href="/cadastro" className="underline">Cadastre-se</a>
        </p>
      </form>
    </main>
  );
}
