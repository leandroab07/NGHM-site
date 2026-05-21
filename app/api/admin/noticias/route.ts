import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

function isAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get('nghm-admin-token')?.value
  return !!token && !!verifyToken(token)
}

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  return NextResponse.redirect(new URL('/api/admin/eventos', req.url))
}
export async function POST() { return NextResponse.json({ error: 'Use /api/admin/eventos' }, { status: 410 }) }
export async function PUT() { return NextResponse.json({ error: 'Use /api/admin/eventos' }, { status: 410 }) }
export async function DELETE() { return NextResponse.json({ error: 'Use /api/admin/eventos' }, { status: 410 }) }
