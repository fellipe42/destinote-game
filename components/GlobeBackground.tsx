
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';

export default function GlobeBackground() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <motion.div
      className="fixed inset-0 -z-20 pointer-events-none"
      style={{ opacity }}
    >
      <div className="absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/2 h-[360px] w-[640px] -translate-x-1/2 rounded-[999px] bg-purple-500/10 blur-3xl" />
    </motion.div>
  );
}


///////////////////////////// try1

// // Componente GlobeBackground - Fundo animado com gradiente dinâmico
// // Cria um efeito visual de globo/esfera com gradientes que mudam

// 'use client';

// import { useEffect, useRef } from 'react';
// import { motion } from 'framer-motion';

// export default function GlobeBackground() {
//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;

//     // Configurar tamanho do canvas
//     const resizeCanvas = () => {
//       canvas.width = window.innerWidth;
//       canvas.height = window.innerHeight;
//     };
//     resizeCanvas();
//     window.addEventListener('resize', resizeCanvas);

//     // Variáveis de animação
//     let frame = 0;

//     // Função de animação
//     const animate = () => {
//       frame++;
      
//       // Criar gradiente dinâmico que se move
//       const gradient = ctx.createRadialGradient(
//         canvas.width / 2 + Math.sin(frame * 0.01) * 200,
//         canvas.height / 2 + Math.cos(frame * 0.01) * 200,
//         0,
//         canvas.width / 2,
//         canvas.height / 2,
//         Math.max(canvas.width, canvas.height) * 0.8
//       );

//       // Cores do gradiente (roxo, azul, rosa) - MUITO sutis para não competir com backgrounds
//       gradient.addColorStop(0, `rgba(139, 92, 246, ${0.05 + Math.sin(frame * 0.02) * 0.02})`); // Roxo muito sutil
//       gradient.addColorStop(0.5, `rgba(59, 130, 246, ${0.03 + Math.sin(frame * 0.015) * 0.02})`); // Azul muito sutil
//       gradient.addColorStop(1, 'rgba(17, 24, 39, 0.3)'); // Cinza escuro sutil

//       // Limpar e desenhar
//       ctx.fillStyle = gradient;
//       ctx.fillRect(0, 0, canvas.width, canvas.height);

//       requestAnimationFrame(animate);
//     };

//     animate();

//     return () => {
//       window.removeEventListener('resize', resizeCanvas);
//     };
//   }, []);

//   return (
//     <>
//       {/* Canvas animado */}
//       <canvas
//         ref={canvasRef}
//         className="fixed inset-0 -z-20"
//       />
      
//       {/* Overlay com pontos/estrelas */}
//       <div className="fixed inset-0 -z-20">
//         {[...Array(50)].map((_, i) => (
//           <motion.div
//             key={i}
//             className="absolute w-1 h-1 bg-white rounded-full"
//             style={{
//               left: `${Math.random() * 100}%`,
//               top: `${Math.random() * 100}%`,
//             }}
//             animate={{
//               opacity: [0.2, 0.8, 0.2],
//               scale: [1, 1.5, 1],
//             }}
//             transition={{
//               duration: 2 + Math.random() * 3,
//               repeat: Infinity,
//               delay: Math.random() * 2,
//             }}
//           />
//         ))}
//       </div>
//     </>
//   );
// }
