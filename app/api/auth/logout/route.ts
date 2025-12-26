import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ success: true })

  // Zera o cookie de userId
  res.cookies.set('userId', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return res
}
