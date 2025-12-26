// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

import { AppSessionProvider } from '@/components/SessionProvider';
import { ExpandedGoalsProvider } from '@/contexts/ExpandedGoalsContext';
import { BulkSelectProvider } from '@/contexts/BulkSelectContext';
import { PersonalizationProvider } from '@/contexts/PersonalizationContext';
import BulkSelectBar from '@/components/BulkSelectBar';

export const metadata: Metadata = {
  title: 'Destinote — 1000 coisas para fazer na vida',
  description:
    'Uma lista épica de experiências, aventuras e objetivos para transformar sua vida, do simples ao extraordinário.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-dn-theme="default">
      <head>
        <meta name="theme-color" content="#0b0b12" />
        <meta name="color-scheme" content="dark light" />

        {/* Aplica tema salvo antes de renderizar (evita "flash" de tema) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try{
    var raw=localStorage.getItem("destinote:personalization:v1");
    if(raw){
      var parsed=JSON.parse(raw);
      if(parsed&&parsed.theme){
        document.documentElement.setAttribute("data-dn-theme",parsed.theme);
        return;
      }
    }
    var cached=localStorage.getItem("destinote:site-defaults-cache:v1");
    if(!cached) return;
    var parsed2=JSON.parse(cached);
    if(parsed2&&parsed2.theme){
      document.documentElement.setAttribute("data-dn-theme",parsed2.theme);
    }
  }catch(e){}
})();`,
          }}
        />
      </head>

      <body className="antialiased">
        <AppSessionProvider>
          <PersonalizationProvider>
            <ExpandedGoalsProvider>
              <BulkSelectProvider>
                {children}

                {/* Overlay global do modo Bulk (só aparece quando ativado) */}
                <BulkSelectBar />
              </BulkSelectProvider>
            </ExpandedGoalsProvider>
          </PersonalizationProvider>
        </AppSessionProvider>
      </body>
    </html>
  );
}
