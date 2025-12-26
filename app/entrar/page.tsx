// app/entrar/page.tsx
'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('public@test.com');
  const [password, setPassword] = useState('D3stinote_dev!2025'); // ou a que você colocou no seed
  const [loading, setLoading] = useState(false);

  const error = searchParams.get('error');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: '/',
    });

    setLoading(false);

    if (!result) {
      alert('Erro inesperado ao tentar logar.');
      return;
    }

    if (result.error) {
      // normalmente vem "CredentialsSignin"
      alert('Email ou senha inválidos.');
      return;
    }

    // deu certo: redireciona pra home
    router.push(result.url ?? '/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
      >
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          Entrar no Destinote
        </h1>
        <p className="text-sm text-white/60 mb-6 text-center">
          Use um dos usuários de teste ou crie em breve sua própria conta.
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-300 bg-red-900/30 border border-red-500/40 rounded-lg px-3 py-2">
            Falha ao entrar. Verifique suas credenciais.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/80 mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">Senha</label>
            <input
              type="password"
              className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 text-white font-semibold py-2.5 rounded-lg text-sm tracking-wide transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.7)]"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-xs text-white/50 space-y-1">
          <p>
            Usuários de teste: <code>[public|user|plus|premium]@test.com</code>
          </p>
          <p>
            Senha: <code>D3stinote_dev!2025</code> (ou a que você definiu no seed)
          </p>
        </div>
      </motion.div>
    </div>
  );
}
