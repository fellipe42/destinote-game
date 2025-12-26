// GUIDE: Helper de autenticação simplificado para Destinote
// TODO: Implementar autenticação real com NextAuth.js ou similar na produção

import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GUIDE: Limites de goals por nível de acesso
export const ACCESS_LIMITS = {
  public: 0,      // Apenas visualização
  user: 10,       // Free: 10 goals na lista
  plus: 100,      // Plus: 100 goals na lista
  premium: 1000,  // Premium: Todos os goals
};

// GUIDE: Obter usuário atual dos cookies (simplificado)
// TODO: Em produção, usar JWT ou session tokens adequados
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  
  if (!userId) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
  });
  
  return user;
}

// GUIDE: Verificar se usuário pode adicionar mais goals à lista
export function canAddMoreGoals(currentCount: number, accessLevel: string): boolean {
  const limit = ACCESS_LIMITS[accessLevel as keyof typeof ACCESS_LIMITS] || 0;
  return currentCount < limit;
}

// GUIDE: Obter limite de goals para o nível de acesso
export function getGoalLimit(accessLevel: string): number {
  return ACCESS_LIMITS[accessLevel as keyof typeof ACCESS_LIMITS] || 0;
}
