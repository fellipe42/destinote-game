// app/api/lists/[listId]/visibility/route.ts
// Motivo: corrigir import de authOptions e evitar múltiplas instâncias do Prisma.

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { listId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const { isPublic } = (await req.json()) as { isPublic: boolean };

  // acha o usuário pelo email
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ ok: false, error: 'user_not_found' }, { status: 404 });
  }

  // garante ownership
  const list = await prisma.userList.findUnique({ where: { id: params.listId } });
  if (!list || list.userId !== user.id) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const updated = await prisma.userList.update({
    where: { id: params.listId },
    data: { isPublic },
  });

  return NextResponse.json({ ok: true, data: updated });
}
