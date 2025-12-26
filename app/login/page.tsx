'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get('callbackUrl') ?? '/my-list';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setSubmitting(false);

    if (!res) {
      setError('Algo inesperado aconteceu ao tentar entrar.');
      return;
    }

    if (res.error) {
      setError('Email ou senha inválidos.');
      return;
    }

    // Sucesso → vai pra callbackUrl (por padrão /my-list)
    router.push(callbackUrl);
  };

  return (
    <main className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* Fundo compatível com o resto do site */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-black via-[#020617] to-black opacity-90" />

      <div className="max-w-md w-full relative">
        {/* Glow de fundo */}
        <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-500/50 via-blue-500/40 to-cyan-400/40 blur-3 opacity-80" />

        <div className="relative bg-black/70 border border-white/10 rounded-2xl px-6 py-7 md:px-8 md:py-9 shadow-2xl backdrop-blur-md">
          <div className="mb-6 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-purple-300/80 mb-2">
              Portal do viajante
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              Entrar no Destinote
            </h1>
            <p className="text-xs md:text-sm text-white/60">
              Acesse sua conta para ver{' '}
              <span className="text-purple-300 font-medium">
                Minha Lista
              </span>{' '}
              e marcar objetivos como concluídos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/70">
                E-mail
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-black/60 border border-white/15 px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-purple-400/80 placeholder:text-white/30"
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/70">
                Senha
              </label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-black/60 border border-white/15 px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-purple-400/80 placeholder:text-white/30"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 mt-1">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-3 inline-flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold text-white py-2.5 shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.02]"
            >
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-5 text-[11px] text-white/45 space-y-1">
            <p>
              Durante o desenvolvimento, você pode usar:
            </p>
            <p className="font-mono text-[11px] text-purple-200">
              public@test.com · user@test.com · plus@test.com · premium@test.com
            </p>
            <p className="font-mono text-[11px] text-purple-200">
              senha: 123456
            </p>
          </div>

          <div className="mt-5 text-xs text-white/50 flex items-center justify-between">
            <Link
              href="/"
              className="hover:text-white/80 transition-colors"
            >
              ← Voltar para a página inicial
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}


// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { LogIn } from 'lucide-react'

// export default function LoginPage() {
//   const router = useRouter()
//   const [email, setEmail] = useState('')
//   const [name, setName] = useState('')
//   const [password, setPassword] = useState('')
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setError(null)
//     setLoading(true)

//     try {
//       const res = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password, name }),
//       })

//       const data = await res.json()

//       if (!res.ok || !data.success) {
//         setError(data.error || 'Erro ao entrar.')
//         setLoading(false)
//         return
//       }

//       // Login OK → volta pra home
//       router.push('/')
//       router.refresh()
//     } catch (err) {
//       console.error(err)
//       setError('Erro inesperado ao tentar entrar.')
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#020817] via-[#050816] to-[#020617] flex items-center justify-center px-4">
//       <div className="max-w-md w-full bg-black/30 border border-white/10 rounded-2xl p-8 shadow-2xl shadow-purple-500/20 backdrop-blur-xl">
//         <div className="flex items-center gap-3 mb-6">
//           <div className="w-10 h-10 rounded-full bg-purple-600/80 flex items-center justify-center shadow-lg shadow-purple-500/40">
//             <LogIn className="text-white" size={22} />
//           </div>
//           <div>
//             <h1 className="text-xl font-semibold text-white">
//               Entrar no Destinote
//             </h1>
//             <p className="text-xs text-white/60">
//               Acesse sua lista pessoal de objetivos e acompanhe seu progresso.
//             </p>
//           </div>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="space-y-1">
//             <label className="text-sm text-white/80">Nome (opcional)</label>
//             <input
//               type="text"
//               className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/60"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               placeholder="Como quer ser chamado na lista?"
//             />
//           </div>

//           <div className="space-y-1">
//             <label className="text-sm text-white/80">Email</label>
//             <input
//               type="email"
//               required
//               className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/60"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               placeholder="voce@exemplo.com"
//             />
//           </div>

//           <div className="space-y-1">
//             <label className="text-sm text-white/80">Senha</label>
//             <input
//               type="password"
//               required
//               className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/60"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               placeholder="Escolha uma senha"
//             />
//           </div>

//           {error && (
//             <p className="text-xs text-red-400 bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2">
//               {error}
//             </p>
//           )}

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full mt-2 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
//           >
//             {loading ? (
//               <span className="text-xs">Conectando...</span>
//             ) : (
//               <>
//                 <LogIn size={18} />
//                 <span>Entrar</span>
//               </>
//             )}
//           </button>
//         </form>

//         <div className="mt-6 text-[10px] text-white/40 leading-relaxed border-t border-white/10 pt-3">
//           <p>
//             💡 Durante o desenvolvimento, você pode usar também os usuários de
//             teste do seed:
//           </p>
//           <ul className="mt-1 space-y-[2px]">
//             <li>public@test.com · senha: 123456</li>
//             <li>user@test.com · senha: 123456</li>
//             <li>plus@test.com · senha: 123456</li>
//             <li>premium@test.com · senha: 123456</li>
//           </ul>
//         </div>
//       </div>
//     </div>
//   )
// }
