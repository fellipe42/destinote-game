// app/api/admin/site-settings/route.ts
// Motivo: corrigir import de authOptions e alinhar o nome do role ("admin").
// Também atualiza apenas UI settings (data), não personalizationDefaults.

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

import { updateSiteUiSettings, type SiteUiSettingsData } from '@/lib/siteSettings';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session || role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as SiteUiSettingsData;
  const saved = await updateSiteUiSettings(body);

  return NextResponse.json({ ok: true, data: saved });
}
