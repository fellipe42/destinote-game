// #### `app/perfil/planos/page.tsx`

'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Check,
  ArrowLeft,
  Star,
  Zap,
  Crown,
  Sparkles,
} from 'lucide-react';
import StaticBackground from '@/components/my-list/StaticBackground';
import Navbar from '@/components/Navbar';

const PLANS = [
  {
    id: 'user',
    name: 'Básico',
    icon: Star,
    price: 'Grátis',
    description: 'Para começar sua jornada',
    limit: 10,
    features: [
      'Até 10 objetivos na lista',
      'Acesso a todos os 1000 objetivos',
      'Visualização de cards',
      'Exportação básica',
    ],
    color: 'from-blue-600 to-cyan-600',
    borderColor: 'border-blue-500/30',
    available: true,
  },
  {
    id: 'plus',
    name: 'Plus',
    icon: Zap,
    price: 'Em breve',
    description: 'Para quem quer mais',
    limit: 100,
    features: [
      'Até 100 objetivos na lista',
      'Acesso a todos os 1000 objetivos',
      'Exportação avançada (PDF, PNG)',
      'Temas personalizados',
      'Sem anúncios',
    ],
    color: 'from-purple-600 to-pink-600',
    borderColor: 'border-purple-500/30',
    available: false,
    badge: 'Popular',
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: Crown,
    price: 'Em breve',
    description: 'Para os verdadeiros aventureiros',
    limit: null,
    features: [
      'Objetivos ilimitados',
      'Acesso a todos os 1000 objetivos',
      'Exportação avançada (PDF, PNG, MP4)',
      'Temas e fundos personalizados',
      'Globo interativo customizável',
      'Prioridade em novos recursos',
      'Sem anúncios',
    ],
    color: 'from-yellow-600 to-orange-600',
    borderColor: 'border-yellow-500/30',
    available: false,
    badge: 'Premium',
  },
];

export default function PlanosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoggedIn = !!session?.user?.email;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/entrar');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <>
        <StaticBackground changeInterval={15000} showGlobe={false} />
        <Navbar />
        <div className="min-h-screen pt-24 px-4 text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse text-xl">Carregando...</div>
          </div>
        </div>
      </>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <StaticBackground changeInterval={15000} showGlobe={false} />
      <Navbar />

      <main className="relative min-h-screen pt-24 px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Botão Voltar */}
          <div className="mb-6">
            <Link
              href="/perfil"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              Voltar para o perfil
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Escolha seu plano
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Desbloqueie todo o potencial da sua lista de objetivos
            </p>
          </div>

          {/* Badge: Em desenvolvimento */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles size={24} className="text-yellow-400" />
                <p className="text-yellow-300 font-bold text-lg">
                  Sistema de pagamentos em desenvolvimento
                </p>
              </div>
              <p className="text-yellow-200/80">
                Estamos preparando uma experiência incrível de checkout. Em breve
                você poderá fazer upgrade do seu plano!
              </p>
            </div>
          </div>

          {/* Cards de planos */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isRecommended = plan.badge === 'Popular';

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border ${plan.borderColor} bg-black/40 backdrop-blur-sm overflow-hidden transition-all hover:scale-105 ${
                    isRecommended ? 'md:scale-110 md:z-10' : ''
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${plan.color} text-white`}
                      >
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="p-8">
                    {/* Ícone e nome */}
                    <div className="mb-6">
                      <div
                        className={`inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r ${plan.color} mb-4`}
                      >
                        <Icon size={28} className="text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-white/60">{plan.description}</p>
                    </div>

                    {/* Preço */}
                    <div className="mb-6">
                      <p className="text-4xl font-bold text-white">{plan.price}</p>
                      {plan.limit !== null && (
                        <p className="text-white/60 text-sm mt-1">
                          Até {plan.limit} objetivos
                        </p>
                      )}
                      {plan.limit === null && (
                        <p className="text-white/60 text-sm mt-1">
                          Objetivos ilimitados
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check
                            size={20}
                            className="text-green-400 shrink-0 mt-0.5"
                          />
                          <span className="text-white/80 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Botão */}
                    <button
                      disabled={!plan.available}
                      className={`w-full py-3 rounded-lg font-semibold transition-all ${
                        plan.available
                          ? `bg-gradient-to-r ${plan.color} text-white hover:scale-105 hover:shadow-lg`
                          : 'bg-white/10 text-white/40 cursor-not-allowed'
                      }`}
                    >
                      {plan.available ? 'Selecionar plano' : 'Em breve'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FAQ ou informações adicionais (opcional) */}
          <div className="mt-16 text-center text-white/60">
            <p className="text-sm">
              Tem dúvidas?{' '}
              <Link href="/#sobre" className="text-purple-400 hover:text-purple-300">
                Entre em contato
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
