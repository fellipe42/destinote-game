// app/planos/page.tsx
export default function PlanosPage() {
  return (
    <main className="min-h-screen px-6 py-16 text-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Planos</h1>
        <p className="text-white/75 mb-10">
          Sua lista está pedindo upgrade — e eu respeito a ambição. 😈
          <br />
          Nesta versão, a página é um placeholder de Sprint para você plugar os planos (Public/User/Plus/Premium).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'User', desc: 'Lista básica + recursos essenciais.' },
            { title: 'Plus', desc: 'Mais slots, exportações e extras.' },
            { title: 'Premium', desc: 'Tudo liberado + coleções premium.' },
          ].map((p) => (
            <div key={p.title} className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <div className="text-lg font-semibold">{p.title}</div>
              <div className="text-sm text-white/70 mt-2">{p.desc}</div>
              <div className="text-xs text-white/50 mt-6">Em breve</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
