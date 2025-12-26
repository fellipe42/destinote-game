// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // log: ['query', 'error', 'warn'], // (opcional) liga se quiser depurar
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

// import { PrismaClient } from '@prisma/client';

// const globalForPrisma = globalThis as unknown as {
//   prisma?: PrismaClient;
// };

// const prismaClient = globalForPrisma.prisma ?? new PrismaClient();

// if (process.env.NODE_ENV !== 'production') {
//   globalForPrisma.prisma = prismaClient;
// }

/////////////////////////// trataiva de bugs de importação ///////////////////////////

// ✅ Suporta os DOIS padrões (pra não quebrar imports espalhados):
//   import prisma from '@/lib/prisma'
//   import { prisma } from '@/lib/prisma'
//export const prisma = prismaClient;
//export default prismaClient;


// // lib/prisma.ts 
// import { PrismaClient } from '@prisma/client';

// // Evita múltiplas instâncias do Prisma Client em dev (devido ao hot-reloading) 
// const globalForPrisma = global as unknown as {
//   prisma: PrismaClient | undefined;
// };

// // Se já existe uma instância global, usa ela, senão cria uma nova with log de erros e atribui ao global 
// export const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     log: ['error', 'query'], // você pode ajustar os níveis de log conforme necessário
//   });

//   // Em dev, atribui ao global para evitar múltiplas instâncias ao recarregar a página 
// if (process.env.NODE_ENV !== 'production') {
//   globalForPrisma.prisma = prisma;
// }

// // Exporta a instância do Prisma Client, pronta para uso, 
// // em toda a aplicação, inclusive em rotas API e server components como page.tsx, etc.
// export default prisma;




