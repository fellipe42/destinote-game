// app/api/site-settings/route.ts
// Motivo: PersonalizationContext espera json.data.personalizationDefaults.
// Agora retornamos { personalizationDefaults, ui } já parseados.

import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/siteSettings';

export async function GET() {
  const data = await getSiteSettings();
  return NextResponse.json({ ok: true, data });
}
