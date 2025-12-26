'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { Goal } from '@/types/goal';
import { X } from 'lucide-react';
import { useLang } from '@/lib/useLang';

interface GoalModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function GoalModal({ goal, isOpen, onClose }: GoalModalProps) {
  const { lang } = useLang();
  return (
    <AnimatePresence>
      {isOpen && goal && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <div className="relative max-w-2xl w-full rounded-2xl bg-black/75 border border-white/10 backdrop-blur-xl p-6 md:p-8">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-white/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <p className="text-xs uppercase tracking-[0.25em] text-white/40 mb-3">
                {lang === 'en' ? `Goal #${goal.id}` : `Objetivo #${goal.id}`}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {goal.title}
              </h2>
              {goal.local && (
                <p className="text-sm text-white/70 mb-4">📍 {goal.local}</p>
              )}
              {goal.description ? (
                <p className="text-sm leading-relaxed text-white/80 whitespace-pre-line">
                  {goal.description}
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-white/60">
                  {lang === 'en'
                    ? 'This goal still has no extra notes. (Soon.)'
                    : 'Este objetivo ainda não tem notas extras. (Por enquanto.)'}
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

////////////////////////////////////////////////// try1

// // Componente GoalModal - Modal para exibir detalhes de um goal
// // Slide lateral com animação suave da direita, empurrando o conteúdo

// 'use client';

// import { motion, AnimatePresence } from 'framer-motion';
// import { X } from 'lucide-react';
// import { Badge } from '@/components/ui/badge';
// import { useEffect } from 'react';

// interface Category {
//   id: number;
//   name: string;
//   color: string | null;
// }

// interface Goal {
//   id: number;
//   title: string;
//   local: string | null;
//   category: Category;
//   isTopTen: boolean;
//   imageUrl: string | null;
//   description: string | null;
//   cod2: string | null;
//   cod3: string | null;
//   refBase: number | null;
// }

// interface GoalModalProps {
//   goal: Goal | null;
//   isOpen: boolean;
//   onClose: () => void;
// }

// export default function GoalModal({ goal, isOpen, onClose }: GoalModalProps) {
//   // Prevenir scroll quando o modal está aberto
//   useEffect(() => {
//     if (isOpen) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'unset';
//     }
//     return () => {
//       document.body.style.overflow = 'unset';
//     };
//   }, [isOpen]);

//   return (
//     <AnimatePresence mode="wait">
//       {isOpen && goal && (
//         <>
//           {/* Overlay escuro */}
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={onClose}
//             className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
//           />

//           {/* Painel lateral deslizante */}
//           <motion.div
//             initial={{ x: '100%', opacity: 0 }}
//             animate={{ x: 0, opacity: 1 }}
//             exit={{ x: '100%', opacity: 0 }}
//             transition={{ 
//               type: 'spring', 
//               damping: 25, 
//               stiffness: 200 
//             }}
//             className="fixed right-0 top-0 h-full w-full md:w-[600px] bg-gray-900 z-50 overflow-y-auto shadow-2xl"
//           >
//             {/* Botão fechar */}
//             <button
//               onClick={onClose}
//               className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
//             >
//               <X size={32} />
//             </button>

//             {/* Conteúdo do modal */}
//             <div className="p-8 space-y-6 text-white">
//               {/* Título */}
//               <div>
//                 <h2 className="text-3xl md:text-4xl font-bold mb-2">
//                   {goal.title}
//                 </h2>
//                 {goal.local && (
//                   <p className="text-lg text-white/70">
//                     📍 {goal.local}
//                   </p>
//                 )}
//               </div>

//               {/* Imagem se for Top 8 */}
//               {goal.isTopTen && goal.imageUrl && (
//                 <div className="relative h-64 rounded-lg overflow-hidden">
//                   {/* Placeholder de imagem */}
//                   <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
//                     <span className="text-white text-8xl font-bold opacity-30">
//                       {goal.id}
//                     </span>
//                   </div>
//                   <div className="absolute top-4 right-4">
//                     <Badge className="bg-yellow-500 text-black text-lg px-4 py-2">
//                       ⭐ Top 8
//                     </Badge>
//                   </div>
//                 </div>
//               )}

//               {/* Categoria */}
//               <div className="flex items-center gap-2">
//                 <span className="text-white/70">Categoria:</span>
//                 <Badge 
//                   className="text-lg px-4 py-1"
//                   style={{
//                     backgroundColor: goal.category.color ? `#${goal.category.color}` : '#888',
//                     color: goal.category.color === 'FFFFFF' ? '#000' : '#fff',
//                   }}
//                 >
//                   {goal.category.name}
//                 </Badge>
//               </div>

//               {/* Descrição (placeholder para futuro) */}
//               <div className="bg-black/30 p-6 rounded-lg">
//                 <h4 className="text-xl font-semibold mb-3">Sobre este objetivo</h4>
//                 <p className="text-white/80 leading-relaxed">
//                   {goal.description || 
//                     `Este é um dos ${goal.isTopTen ? 'principais ' : ''}objetivos da lista Destinote. 
//                     Em breve, teremos mais informações, dicas e histórias de pessoas que já completaram este objetivo!`}
//                 </p>
//               </div>

//               {/* Informações adicionais */}
//               <div className="grid grid-cols-2 gap-4 text-sm text-white/60">
//                 <div>
//                   <span className="font-semibold">Número:</span> {goal.id}
//                 </div>
//                 {/* Preparado para futuro campo "Local" e thumbnail do CSV */}
//                 {goal.local && (
//                   <div>
//                     <span className="font-semibold">Local:</span> {goal.local}
//                   </div>
//                 )}
//               </div>

//               {/* Botões de ação (placeholder para futuro) */}
//               <div className="flex flex-col sm:flex-row gap-3 pt-4">
//                 <motion.button
//                   whileHover={{ scale: 1.02 }}
//                   whileTap={{ scale: 0.98 }}
//                   className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors"
//                 >
//                   ✓ Marcar como completo
//                 </motion.button>
//                 <motion.button
//                   whileHover={{ scale: 1.02 }}
//                   whileTap={{ scale: 0.98 }}
//                   className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
//                 >
//                   + Adicionar à minha lista
//                 </motion.button>
//               </div>
//             </div>
//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>
//   );
// }
